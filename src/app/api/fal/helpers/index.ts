// Common error handler for fal.ai API errors
export function handleFalError(error: any): string {
    debugger;
    let errorMessage = "Unknown error occurred";
    
    if (error && typeof error === 'object') {
      if ('status' in error) {
        console.error("Error status:", error.status);
      }
      console.error("Error properties:", Object.keys(error));
      
      // Check for fal.ai API error structure
      if ('body' in error && error.body && typeof error.body === 'object') {
        console.error("Error body:", error.body);
        
        // Check for detail array with validation errors
        if ('detail' in error.body && Array.isArray(error.body.detail) && error.body.detail.length > 0) {
          const firstError = error.body.detail[0];
          if ('msg' in firstError) {
            errorMessage = firstError.msg;
            console.error("Extracted error message:", errorMessage);
          }
        }
      }
    }
    
    return errorMessage;
  }