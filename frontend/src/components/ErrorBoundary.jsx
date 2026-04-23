import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error, info);
  }
  reset = () => {
    this.setState({ error: null });
    window.location.href = "/";
  };
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F5F7]">
          <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-md shadow p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FF9933]/15 text-[#B36B22] flex items-center justify-center mx-auto mb-4 font-bold text-2xl">!</div>
            <h2 className="font-display font-bold text-xl text-[#0A0A0A]">Something went wrong</h2>
            <p className="mt-2 text-sm text-[#6B7280]">The application hit an unexpected error. Returning to the dashboard usually resolves it.</p>
            <pre className="mt-4 text-left text-[10px] text-[#DC2626] bg-[#FEF2F2] p-2 rounded overflow-auto max-h-32">{String(this.state.error?.message || this.state.error)}</pre>
            <button onClick={this.reset} className="mt-4 bg-[#2E3192] hover:bg-[#202266] text-white font-semibold rounded-md px-4 py-2">
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
