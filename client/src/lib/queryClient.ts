import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Generate a unique request ID for tracking logs across operations
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 10);
};

// Error classification for better handling strategies
enum ErrorCategory {
  NETWORK = 'network',
  SERVER = 'server',
  AUTH = 'authentication',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Classify error based on HTTP status code or error properties
function classifyError(status: number | null, errorObj: unknown): ErrorCategory {
  // If we have a status code, use it to classify
  if (status !== null) {
    if (status >= 500) return ErrorCategory.SERVER;
    if (status === 401 || status === 403) return ErrorCategory.AUTH;
    if (status >= 400 && status < 500) return ErrorCategory.CLIENT;
    return ErrorCategory.UNKNOWN;
  }
  
  // For network errors or other exceptions
  if (errorObj instanceof Error) {
    if (
      errorObj.message.includes('network') || 
      errorObj.message.includes('fetch') || 
      errorObj.message.includes('connection')
    ) {
      return ErrorCategory.NETWORK;
    }
  }
  
  return ErrorCategory.UNKNOWN;
}

// Determines if an error should be retried based on its category
function isRetryableError(category: ErrorCategory): boolean {
  return category === ErrorCategory.NETWORK || category === ErrorCategory.SERVER;
}

// Helper to format and extract error messages
function formatErrorMessage(status: number | null, errorText: string, statusText?: string): string {
  if (status === null) return errorText;
  return `${status}: ${errorText || statusText || 'Unknown error'}`;
}

/**
 * Enhanced API request function with improved error handling and logging
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retries = 2,
  backoffDelay = 300
): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = performance.now();
  console.log(`[${requestId}] 🔄 Starting ${method} request to: ${url}`, data ? { data } : '');
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "Accept": "application/json",
        "X-Request-ID": requestId
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    if (!res.ok) {
      const errorText = await res.text();
      const errorCategory = classifyError(res.status, null);
      
      console.error(
        `[${requestId}] ❌ Error ${res.status} for ${method} ${url} (${duration}ms): ${errorText}`, 
        { category: errorCategory, retryable: isRetryableError(errorCategory) }
      );
      
      // Implement retry logic with exponential backoff for retryable errors
      if (retries > 0 && isRetryableError(errorCategory)) {
        const nextBackoff = backoffDelay * 2;
        console.log(`[${requestId}] 🔄 Retrying request after ${backoffDelay}ms (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return apiRequest(method, url, data, retries - 1, nextBackoff);
      }
      
      throw new Error(formatErrorMessage(res.status, errorText, res.statusText));
    }
    
    console.log(`[${requestId}] ✅ Successful ${method} request to ${url}: Status ${res.status} (${duration}ms)`);
    return res;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    const errorCategory = classifyError(null, error);
    
    console.error(
      `[${requestId}] ❌ Failed ${method} request to ${url} (${duration}ms):`, 
      error,
      { category: errorCategory, retryable: isRetryableError(errorCategory) }
    );
    
    // Implement retry logic with exponential backoff for retryable errors
    if (retries > 0 && isRetryableError(errorCategory)) {
      const nextBackoff = backoffDelay * 2;
      console.log(`[${requestId}] 🔄 Retrying request after ${backoffDelay}ms (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return apiRequest(method, url, data, retries - 1, nextBackoff);
    }
    
    throw error;
  }
}

/**
 * Enhanced query function for React Query
 */
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  maxRetries?: number;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, maxRetries = 1 }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const requestId = generateRequestId();
    const startTime = performance.now();
    
    console.log(`[${requestId}] 🔍 Making query request to: ${url}`);
    
    let retries = maxRetries;
    let backoffDelay = 300;
    
    while (true) {
      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "X-Request-ID": requestId
          }
        });

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        // Special handling for 401 Unauthorized based on configuration
        if (res.status === 401) {
          console.log(`[${requestId}] 🔒 Received 401 for ${url} (${duration}ms)`);
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
        }

        if (!res.ok) {
          const errorText = await res.text();
          const errorCategory = classifyError(res.status, null);
          
          console.error(
            `[${requestId}] ❌ Error ${res.status} for ${url} (${duration}ms): ${errorText}`,
            { category: errorCategory, retryable: isRetryableError(errorCategory) }
          );
          
          // Retry logic for retryable errors
          if (retries > 0 && isRetryableError(errorCategory)) {
            console.log(`[${requestId}] 🔄 Retrying request after ${backoffDelay}ms (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            retries--;
            backoffDelay *= 2;
            continue; // Retry the loop
          }
          
          if (unauthorizedBehavior === "throw") {
            throw new Error(formatErrorMessage(res.status, errorText, res.statusText));
          }
          
          // If we get here, it's an error we're not throwing for
          return null;
        }

        try {
          const data = await res.json();
          console.log(`[${requestId}] ✅ Successfully fetched data from ${url} (${duration}ms)`);
          return data;
        } catch (parseError) {
          console.error(`[${requestId}] ❌ Failed to parse JSON from ${url} (${duration}ms):`, parseError);
          
          // For JSON parsing errors, we don't retry
          return null;
        }
      } catch (error) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        const errorCategory = classifyError(null, error);
        
        console.error(
          `[${requestId}] ❌ Network error for ${url} (${duration}ms):`, 
          error,
          { category: errorCategory, retryable: isRetryableError(errorCategory) }
        );
        
        // Retry logic for retryable errors
        if (retries > 0 && isRetryableError(errorCategory)) {
          console.log(`[${requestId}] 🔄 Retrying request after ${backoffDelay}ms (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          retries--;
          backoffDelay *= 2;
          continue; // Retry the loop
        }
        
        if (unauthorizedBehavior === "throw") {
          throw error;
        }
        
        return null;
      }
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", maxRetries: 2 }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false, // We handle retries in our custom query function
    },
    mutations: {
      retry: false, // We handle retries in our apiRequest function
    },
  },
});
