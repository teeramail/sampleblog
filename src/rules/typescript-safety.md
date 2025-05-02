---
TYPESCRIPT_SAFETY
---
description: Guidelines for writing type-safe TypeScript code to prevent common runtime errors
globs: **/*.ts,**/*.tsx
filesToApplyRule: **/*.ts,**/*.tsx
alwaysApply: true
---

- **Null and Undefined Checks**
  - Always check if a value might be null or undefined before using it in operations
  - Use optional chaining (`?.`) when accessing properties of objects that might be null/undefined
  - Use nullish coalescing (`??`) to provide fallback values
  - Example: `const value = obj?.property ?? defaultValue;`

- **Type Assertions and Guards**
  - Avoid using type assertions (`as Type`) unless absolutely necessary
  - Prefer type guards (`if (typeof value === 'string')`) over assertions
  - When using type assertions, ensure the value actually matches the asserted type
  - Example: `if (typeof value === 'string') { /* string operations */ }`

- **Array Access Safety**
  - Always check if an array index exists before accessing it
  - Use optional chaining for array access: `array?.[index]`
  - Check array length before accessing elements: `if (index < array.length)`
  - Example: `const item = index < array.length ? array[index] : undefined;`

- **DOM API Safety**
  - Always check if DOM elements exist before manipulating them
  - Use optional chaining when accessing DOM element properties
  - Check if browser APIs are available before using them
  - Example: `if (typeof URL !== 'undefined' && url) { URL.revokeObjectURL(url); }`

- **Function Parameters**
  - Use default parameter values for optional parameters
  - Destructure objects with default values for properties
  - Validate parameters before using them in critical operations
  - Example: `function process(param: string = '', options: Options = {})`

- **Async Operations**
  - Always handle errors in Promise chains with `.catch()`
  - Use try/catch blocks in async/await functions
  - Check if async results exist before using them
  - Example: 
    ```typescript
    try {
      const result = await asyncOperation();
      if (result) {
        // use result
      }
    } catch (error) {
      // handle error
    }
    ```

- **Type Definitions**
  - Define interfaces or types for complex objects
  - Use union types to represent values that could be of different types
  - Make properties optional when appropriate using the `?` modifier
  - Example: `interface User { id: string; name: string; email?: string; }`

- **URL and File Operations**
  - Always check if URLs or file paths exist before operations
  - Validate URL strings before creating URL objects
  - For URL.revokeObjectURL, always check if the URL string exists
  - Example:
    ```typescript
    const url = previews[index];
    if (url && typeof url === 'string') {
      URL.revokeObjectURL(url);
    }
    ```
