# Loading States Implementation Guide

## Overview

PyMastery now includes a comprehensive loading states system that provides consistent user feedback across all components and operations. This guide covers the implementation, usage, and best practices for loading states.

## Features

### 🎯 Core Components

#### 1. Loading States Component (`LoadingStates.tsx`)
- **Multiple Variants**: Spinner, Skeleton, Progress, Dots, Pulse, Wave
- **Different Sizes**: sm, md, lg, xl
- **State Management**: idle, loading, success, error, partial
- **Customizable**: Messages, progress, styling

#### 2. Context Provider (`LoadingProvider.tsx`)
- **Global State Management**: Centralized loading state
- **Multiple Hook Types**: Route, API, Form, File Upload
- **Memory Management**: Automatic cleanup and optimization
- **Event System**: Loading events and notifications

#### 3. Enhanced Components (`SimpleEnhancedComponents.tsx`)
- **Pre-built Components**: Course cards, user profiles, analytics
- **Integrated Loading**: Built-in loading states
- **Responsive Design**: Mobile-optimized loading indicators
- **Error Handling**: Graceful error states and recovery

## Usage Examples

### Basic Loading State

```tsx
import { Loading, LoadingState } from '../components/ui/LoadingStates';

function MyComponent() {
  const [state, setState] = useState<LoadingState>('idle');

  return (
    <Loading
      state={state}
      message="Loading data..."
      variant="spinner"
      size="md"
    />
  );
}
```

### Async Operations with Loading

```tsx
import { useLoadingItem } from '../components/ui/LoadingStates';

function DataComponent() {
  const { setLoading, complete, error, isLoading } = useLoadingItem('data-fetch');

  const fetchData = async () => {
    try {
      setLoading('loading', { message: 'Fetching data...' });
      const data = await api.fetchData();
      complete();
      return data;
    } catch (err) {
      error('Failed to fetch data');
      throw err;
    }
  };

  return (
    <div>
      {isLoading && <InlineLoading message="Loading..." />}
      {/* Your component content */}
    </div>
  );
}
```

### Form with Loading

```tsx
import { useFormLoading } from '../components/LoadingProvider';

function ContactForm() {
  const { 
    isLoading, 
    errors, 
    startLoading, 
    setFieldError, 
    stopLoading 
  } = useFormLoading('contact-form');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      startLoading('Sending message...');
      await api.sendContactForm(formData);
      stopLoading(true); // Success
    } catch (err) {
      setFieldError('submit', 'Failed to send message');
      stopLoading(false); // Error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? (
          <ButtonLoading message="Sending..." />
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
```

### File Upload with Progress

```tsx
import { useFileUploadLoading } from '../components/LoadingProvider';

function FileUploader() {
  const { 
    uploads, 
    isUploading, 
    startUpload, 
    updateUploadProgress, 
    completeUpload 
  } = useFileUploadLoading();

  const handleFileUpload = async (file) => {
    const fileId = `file-${Date.now()}`;
    startUpload(fileId, file.name);

    try {
      await api.uploadFile(file, (progress) => {
        updateUploadProgress(fileId, progress);
      });
      completeUpload(fileId);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      {uploads.map(([id, upload]) => (
        <div key={id}>
          <div>{upload.name}</div>
          <div className="progress-bar">
            <div 
              style={{ width: `${upload.progress}%` }}
              className="progress-fill"
            />
          </div>
          <div>{upload.state}</div>
        </div>
      ))}
    </div>
  );
}
```

## Component Library

### Loading Variants

#### Spinner Loading
```tsx
<Loading
  state="loading"
  variant="spinner"
  size="lg"
  message="Processing..."
/>
```

#### Skeleton Loading
```tsx
<Loading
  state="loading"
  variant="skeleton"
  size="md"
/>
```

#### Progress Bar
```tsx
<Loading
  state="loading"
  variant="progress"
  progress={75}
  showPercentage={true}
/>
```

#### Dots Animation
```tsx
<Loading
  state="loading"
  variant="dots"
  size="sm"
/>
```

### Specialized Loading Components

#### Course Card Loading
```tsx
import { SimpleCourseCard } from '../components/SimpleEnhancedComponents';

<SimpleCourseCard
  course={course}
  onEnroll={handleEnroll}
  isLoading={isEnrolling}
/>
```

#### Analytics Dashboard Loading
```tsx
import { SimpleAnalyticsDashboard } from '../components/SimpleEnhancedComponents';

<SimpleAnalyticsDashboard
  data={analyticsData}
  onRefresh={handleRefresh}
/>
```

#### Search with Loading
```tsx
import { SimpleSearch } from '../components/SimpleEnhancedComponents';

<SimpleSearch
  onSearch={handleSearch}
  placeholder="Search courses..."
/>
```

## Best Practices

### 1. Loading State Management

#### DO:
- Use specific loading IDs for different operations
- Provide meaningful loading messages
- Handle success and error states
- Clean up loading states when done

#### DON'T:
- Leave loading states running indefinitely
- Use generic "Loading..." messages everywhere
- Ignore error states
- Create memory leaks with unresolved states

### 2. User Experience

#### DO:
- Show loading indicators immediately
- Provide progress feedback for long operations
- Allow users to cancel operations when possible
- Use skeleton loaders for content that will appear

#### DON'T:
- Make users wait without feedback
- Block the entire interface unnecessarily
- Use loading spinners for quick operations
- Remove content during loading

### 3. Performance

#### DO:
- Use debounced loading for rapid actions
- Clean up unused loading states
- Optimize loading animations
- Use CSS animations instead of JavaScript when possible

#### DON'T:
- Create excessive loading states
- Use heavy animations for simple loading
- Forget to cleanup event listeners
- Block the main thread with loading logic

## Integration Guide

### 1. App Setup

```tsx
// App.tsx
import { LoadingProvider } from './components/LoadingProvider';

function App() {
  return (
    <LoadingProvider>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </LoadingProvider>
  );
}
```

### 2. Route-Level Loading

```tsx
// RouteComponent.tsx
import { useRouteLoading } from '../components/LoadingProvider';

function CoursePage() {
  const { 
    isLoading, 
    progress, 
    startLoading, 
    stopLoading 
  } = useRouteLoading('course-page');

  useEffect(() => {
    startLoading('Loading course data...');
    
    fetchCourseData()
      .then(() => stopLoading())
      .catch(() => stopLoading());
  }, []);

  return (
    <div>
      {isLoading ? (
        <Loading state="loading" progress={progress} />
      ) : (
        <CourseContent />
      )}
    </div>
  );
}
```

### 3. API Integration

```tsx
// api.ts
import { useApiLoading } from '../components/LoadingProvider';

export function useApi() {
  const { startApiCall, updateApiCall, stopApiCall } = useApiLoading();

  const apiCall = async (endpoint: string, options?: any) => {
    const requestId = startApiCall(endpoint);
    
    try {
      const response = await fetch(`/api/${endpoint}`, options);
      updateApiCall(requestId, 'success');
      return response.json();
    } catch (error) {
      updateApiCall(requestId, 'error', error.message);
      throw error;
    } finally {
      stopApiCall(requestId);
    }
  };

  return { apiCall };
}
```

## Customization

### 1. Theme Integration

```tsx
// Customize loading colors and styles
const customLoading = (
  <Loading
    state="loading"
    className="custom-loading-style"
    style={{
      '--loading-color': '#your-brand-color',
      '--loading-size': '24px'
    }}
  />
);
```

### 2. Custom Loading Messages

```tsx
const getLoadingMessage = (operation: string) => {
  const messages = {
    'fetch': 'Retrieving your data...',
    'save': 'Saving your changes...',
    'upload': 'Uploading your files...',
    'delete': 'Removing items...'
  };
  
  return messages[operation] || 'Loading...';
};
```

### 3. Loading Variants by Context

```tsx
const getLoadingVariant = (context: string) => {
  const variants = {
    'form': 'skeleton',
    'data': 'spinner',
    'upload': 'progress',
    'search': 'dots'
  };
  
  return variants[context] || 'spinner';
};
```

## Testing

### 1. Unit Testing

```tsx
// LoadingComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { Loading } from '../LoadingStates';

test('shows loading message', () => {
  render(
    <Loading 
      state="loading" 
      message="Test loading message" 
    />
  );
  
  expect(screen.getByText('Test loading message')).toBeInTheDocument();
});
```

### 2. Integration Testing

```tsx
// FormComponent.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import { FormComponent } from '../FormComponent';

test('shows loading during form submission', async () => {
  render(<FormComponent />);
  
  const submitButton = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(submitButton);
  
  expect(screen.getByText('Submitting...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Loading State Not Updating
- **Problem**: Loading state doesn't change when expected
- **Solution**: Check if component is wrapped in LoadingProvider
- **Code**: Ensure correct loading ID is used

#### 2. Memory Leaks
- **Problem**: Loading states accumulate over time
- **Solution**: Use cleanup functions and useEffect properly
- **Code**: Call stopLoading or clearLoading when done

#### 3. Performance Issues
- **Problem**: Loading animations are slow
- **Solution**: Use CSS animations and optimize re-renders
- **Code**: Debounce rapid loading state changes

### Debug Tools

```tsx
// Debug loading states
import { useGlobalLoading } from '../components/LoadingProvider';

function DebugLoading() {
  const { state } = useGlobalLoading();
  
  useEffect(() => {
    console.log('Loading state:', {
      isLoading: state.isLoading,
      loadingCount: state.loadingCount,
      activeItems: Array.from(state.loadingItems.entries())
    });
  }, [state]);

  return null; // Debug component, renders nothing
}
```

## Migration Guide

### From Old Loading States

1. **Replace Simple Spinners**
```tsx
// Old
{isLoading && <Spinner />}

// New
{isLoading && <Loading state="loading" variant="spinner" />}
```

2. **Replace Inline Loading**
```tsx
// Old
const [loading, setLoading] = useState(false);

// New
const { setLoading, isLoading } = useLoadingItem('my-component');
```

3. **Replace Form Loading**
```tsx
// Old
const [formLoading, setFormLoading] = useState(false);

// New
const { isLoading, startLoading, stopLoading } = useFormLoading('my-form');
```

## Performance Optimization

### 1. Lazy Loading
```tsx
// Load loading components only when needed
const LoadingComponent = React.lazy(() => import('../components/LoadingStates'));

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <LoadingComponent />
</Suspense>
```

### 2. Memoization
```tsx
// Memoize loading configurations
const loadingConfig = useMemo(() => ({
  variant: 'spinner',
  size: 'md',
  timeout: 5000
}), []);

// Use in components
<Loading {...loadingConfig} state={state} />
```

### 3. Debouncing
```tsx
// Debounce rapid loading changes
const debouncedSetLoading = useMemo(
  () => debounce(setLoading, 300),
  [setLoading]
);
```

## Conclusion

The PyMastery loading states system provides:

- ✅ **Consistent UX**: Uniform loading feedback across all components
- ✅ **Developer Friendly**: Easy-to-use hooks and components
- ✅ **Performance Optimized**: Efficient state management and animations
- ✅ **Customizable**: Flexible styling and behavior options
- ✅ **Accessible**: Screen reader friendly and keyboard navigable
- ✅ **Type Safe**: Full TypeScript support with type checking

This system ensures users always know what's happening in the application, reducing confusion and improving the overall user experience.

For additional support or questions, refer to the component documentation or contact the development team.
