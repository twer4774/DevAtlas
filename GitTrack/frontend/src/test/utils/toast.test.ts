import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from '../../utils/toast';
import { mockToast, setupMocks } from '../utils';

// Setup mocks
setupMocks();

describe('toast utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('should show success toast with message', () => {
      toast.success('Operation completed successfully');

      expect(mockToast.success).toHaveBeenCalledWith('Operation completed successfully', {
        duration: 4000,
        position: 'top-right'
      });
    });

    it('should show success toast with custom options', () => {
      toast.success('Custom success', { duration: 6000 });

      expect(mockToast.success).toHaveBeenCalledWith('Custom success', {
        duration: 6000,
        position: 'top-right'
      });
    });
  });

  describe('error', () => {
    it('should show error toast with message', () => {
      toast.error('Something went wrong');

      expect(mockToast.error).toHaveBeenCalledWith('Something went wrong', {
        duration: 6000,
        position: 'top-right'
      });
    });

    it('should show error toast with custom options', () => {
      toast.error('Custom error', { duration: 8000 });

      expect(mockToast.error).toHaveBeenCalledWith('Custom error', {
        duration: 8000,
        position: 'top-right'
      });
    });
  });

  describe('info', () => {
    it('should show info toast with message', () => {
      toast.info('Information message');

      expect(mockToast).toHaveBeenCalledWith('Information message', {
        duration: 4000,
        position: 'top-right',
        icon: 'ℹ️'
      });
    });

    it('should show info toast with custom options', () => {
      toast.info('Custom info', { duration: 5000, icon: '📢' });

      expect(mockToast).toHaveBeenCalledWith('Custom info', {
        duration: 5000,
        position: 'top-right',
        icon: '📢'
      });
    });
  });

  describe('warning', () => {
    it('should show warning toast with message', () => {
      toast.warning('Warning message');

      expect(mockToast).toHaveBeenCalledWith('Warning message', {
        duration: 5000,
        position: 'top-right',
        icon: '⚠️'
      });
    });

    it('should show warning toast with custom options', () => {
      toast.warning('Custom warning', { duration: 7000 });

      expect(mockToast).toHaveBeenCalledWith('Custom warning', {
        duration: 7000,
        position: 'top-right',
        icon: '⚠️'
      });
    });
  });

  describe('loading', () => {
    it('should show loading toast with message', () => {
      const toastId = toast.loading('Loading...');

      expect(mockToast.loading).toHaveBeenCalledWith('Loading...', {
        position: 'top-right'
      });
      expect(toastId).toBeDefined();
    });

    it('should show loading toast with custom options', () => {
      toast.loading('Custom loading', { position: 'bottom-center' });

      expect(mockToast.loading).toHaveBeenCalledWith('Custom loading', {
        position: 'bottom-center'
      });
    });
  });

  describe('dismiss', () => {
    it('should dismiss specific toast by id', () => {
      const toastId = 'toast-123';
      toast.dismiss(toastId);

      expect(mockToast.dismiss).toHaveBeenCalledWith(toastId);
    });

    it('should dismiss all toasts when no id provided', () => {
      toast.dismiss();

      expect(mockToast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('promise', () => {
    it('should handle successful promise', async () => {
      const successPromise = Promise.resolve('Success result');
      
      const result = await toast.promise(successPromise, {
        loading: 'Processing...',
        success: 'Completed successfully!',
        error: 'Failed to process'
      });

      expect(mockToast.loading).toHaveBeenCalledWith('Processing...', {
        position: 'top-right'
      });
      expect(result).toBe('Success result');
    });

    it('should handle rejected promise', async () => {
      const errorPromise = Promise.reject(new Error('Promise failed'));
      
      try {
        await toast.promise(errorPromise, {
          loading: 'Processing...',
          success: 'Completed successfully!',
          error: 'Failed to process'
        });
      } catch (error) {
        expect(error.message).toBe('Promise failed');
      }

      expect(mockToast.loading).toHaveBeenCalledWith('Processing...', {
        position: 'top-right'
      });
    });

    it('should handle promise with function messages', async () => {
      const successPromise = Promise.resolve({ name: 'John' });
      
      await toast.promise(successPromise, {
        loading: 'Loading user...',
        success: (data) => `Welcome ${data.name}!`,
        error: (err) => `Error: ${err.message}`
      });

      expect(mockToast.loading).toHaveBeenCalledWith('Loading user...', {
        position: 'top-right'
      });
    });
  });

  describe('custom', () => {
    it('should show custom toast with component', () => {
      const CustomComponent = () => 'Custom toast content';
      
      toast.custom(CustomComponent);

      expect(mockToast).toHaveBeenCalledWith(CustomComponent, {
        position: 'top-right'
      });
    });

    it('should show custom toast with options', () => {
      const CustomComponent = () => 'Custom toast content';
      
      toast.custom(CustomComponent, { duration: 3000 });

      expect(mockToast).toHaveBeenCalledWith(CustomComponent, {
        duration: 3000,
        position: 'top-right'
      });
    });
  });

  describe('configuration', () => {
    it('should use default position for all toasts', () => {
      toast.success('Success');
      toast.error('Error');
      toast.info('Info');
      toast.warning('Warning');

      expect(mockToast.success).toHaveBeenCalledWith('Success', 
        expect.objectContaining({ position: 'top-right' })
      );
      expect(mockToast.error).toHaveBeenCalledWith('Error', 
        expect.objectContaining({ position: 'top-right' })
      );
      expect(mockToast).toHaveBeenCalledWith('Info', 
        expect.objectContaining({ position: 'top-right' })
      );
      expect(mockToast).toHaveBeenCalledWith('Warning', 
        expect.objectContaining({ position: 'top-right' })
      );
    });

    it('should allow position override', () => {
      toast.success('Success', { position: 'bottom-left' });

      expect(mockToast.success).toHaveBeenCalledWith('Success', {
        duration: 4000,
        position: 'bottom-left'
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty messages', () => {
      toast.success('');
      toast.error('');

      expect(mockToast.success).toHaveBeenCalledWith('', expect.any(Object));
      expect(mockToast.error).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('should handle null/undefined messages', () => {
      toast.success(null as any);
      toast.error(undefined as any);

      expect(mockToast.success).toHaveBeenCalledWith(null, expect.any(Object));
      expect(mockToast.error).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      
      toast.info(longMessage);

      expect(mockToast).toHaveBeenCalledWith(longMessage, expect.any(Object));
    });
  });

  describe('accessibility', () => {
    it('should include accessibility options', () => {
      toast.success('Accessible success', { 
        ariaProps: { 
          role: 'status',
          'aria-live': 'polite'
        }
      });

      expect(mockToast.success).toHaveBeenCalledWith('Accessible success', 
        expect.objectContaining({
          ariaProps: {
            role: 'status',
            'aria-live': 'polite'
          }
        })
      );
    });
  });

  describe('theming', () => {
    it('should support custom styling', () => {
      toast.success('Styled success', {
        style: {
          background: '#10B981',
          color: 'white'
        }
      });

      expect(mockToast.success).toHaveBeenCalledWith('Styled success',
        expect.objectContaining({
          style: {
            background: '#10B981',
            color: 'white'
          }
        })
      );
    });

    it('should support custom class names', () => {
      toast.error('Styled error', {
        className: 'custom-error-toast'
      });

      expect(mockToast.error).toHaveBeenCalledWith('Styled error',
        expect.objectContaining({
          className: 'custom-error-toast'
        })
      );
    });
  });
});