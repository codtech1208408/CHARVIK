declare module 'aos' {
  interface AosOptions {
    duration?: number;
    easing?: string;
    once?: boolean;
    offset?: number;
    delay?: number;
    disable?: boolean | 'mobile' | 'phone' | 'tablet';
  }
  const aos: {
    init: (options?: AosOptions) => void;
    refresh: () => void;
    refreshHard: () => void;
  };
  export default aos;
}
