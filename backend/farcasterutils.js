import { FrameSDK } from "@farcaster/frame-sdk";
import dotenv from "dotenv";
dotenv.config();

const FARCASTER_API_KEY = process.env.FARCASTER_API_KEY;

const sdk = new FrameSDK({ apiKey: FARCASTER_API_KEY });

/**
 * Send a programmable direct cast with a PDF attachment to a Farcaster FID.
 * @param {string} fid - Farcaster FID of the recipient
 * @param {string} message - Message to include
 * @param {Buffer} pdfBuffer - PDF data as a buffer
 * @returns {Promise<boolean>}
 */
export async function sendDirectCast(fid, message, pdfBuffer) {
  try {
    // Create a file object for the PDF
    const pdfFile = new File([pdfBuffer], "wally_data.pdf", { type: "application/pdf" });

    // Use the Farcaster SDK to send a programmable direct cast with the file
    await sdk.casts.sendDirectCast({
      fid,
      text: message,
      attachments: [pdfFile] // or use the SDK's documented file upload method
    });

    return true;
  } catch (error) {
    console.error("[FARCASTER] Failed to send direct cast:", error);
    return false;
  }
}