import { useState } from "react";

export const DeleteAccount = () => {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [step, setStep] = useState<"request" | "confirm" | "success" | "error">(
    "request",
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // This would call the API - for now just show confirmation step
      // In production, this calls: POST /graphql with requestAccountDeletion mutation
      // The user needs to be authenticated for this to work

      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("confirm");
    } catch (error) {
      setErrorMessage("Failed to request account deletion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // This would call: POST /graphql with deleteAccount mutation
      // The confirmation code is sent via email

      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("success");
    } catch (error) {
      setErrorMessage("Invalid confirmation code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Spark<span className="text-brand-purple">.</span>
          </h1>
          <p className="text-text-muted">Account Deletion</p>
        </div>

        <div className="bg-bg-surface rounded-2xl p-8 border border-border-subtle">
          {step === "request" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-4">
                Delete Your Account
              </h2>
              <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                We're sorry to see you go. Deleting your account will
                permanently remove all your data, including your profile,
                matches, messages, and photos. This action cannot be undone.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <p className="text-amber-400 text-sm">
                  ⚠️ To delete your account, please open this page from within
                  the Spark app (Profile → Settings → Delete Account). You
                  must be logged in to delete your account.
                </p>
              </div>

              <form onSubmit={handleRequestDeletion}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Request Account Deletion"}
                </button>
              </form>
            </>
          )}

          {step === "confirm" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-4">
                Confirm Deletion
              </h2>
              <p className="text-text-secondary mb-6 text-sm">
                We've sent a confirmation code to your email. Please enter it
                below to confirm deletion.
              </p>

              <form onSubmit={handleConfirmDeletion} className="space-y-4">
                <div>
                  <label className="block text-sm text-text-muted mb-2">
                    Confirmation Code
                  </label>
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white placeholder-text-faint focus:outline-none focus:border-brand-purple"
                    required
                  />
                </div>

                {errorMessage && (
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !confirmationCode}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Permanently Delete Account"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="w-full text-text-secondary hover:text-white py-2 transition-colors text-sm"
                >
                  Cancel
                </button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Account Deleted
              </h2>
              <p className="text-text-secondary text-sm">
                Your account and all associated data have been permanently
                deleted. Thank you for using Spark.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-text-faint text-xs mt-6">
          Need help? Contact{" "}
          <a
            href="mailto:support@spark.example.com"
            className="text-brand-purple hover:underline"
          >
            support@spark.example.com
          </a>
        </p>
      </div>
    </div>
  );
};
