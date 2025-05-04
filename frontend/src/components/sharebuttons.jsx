import { sdk } from "@farcaster/frame-sdk";

export default function ShareButtons() {
  const currentUrl = encodeURIComponent(window.location.href);
  const feedbackUrl = "https://warpcast.com/schmidtiest.eth";

  const shareOnFarcaster = async () => {
    try {
      await sdk.actions.share({
        text: `🚨 Just started watching a wallet with Wally! Check it out: ${window.location.href}`,
      });
      console.log("Shared successfully on Farcaster!");
    } catch (error) {
      console.error("Failed to share on Farcaster:", error);
    }
  };

  return (
    <div className="mt-4 flex gap-4">
      <button
        onClick={shareOnFarcaster}
        className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
      >
        Share on Farcaster
      </button>
      <a
        href={feedbackUrl}
        target="_blank"
        rel="noreferrer"
        className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800"
      >
        Send Feedback
      </a>
    </div>
  );
}