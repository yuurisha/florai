import { db, auth } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { updateGreenSpaceHealth } from "@/controller/greenSpaceController";

const uploadsRef = collection(db, "uploads");

/**
 * Upload flow: Photo → AI Model → Prediction → Firebase (no photo storage)
 * This avoids CORS issues and saves storage costs while still updating the map/green space
 */
export const uploadLeafPhotoAndPredict = async (file: File, greenSpaceId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  try {
    console.log("1) sending photo to AI model for prediction...");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/predictHealth", { method: "POST", body: formData });

    // Log response status
    console.log("📥 API response status:", res.status, res.statusText);

    // if API errors, res.json() might still work, but let's be safe:
    const data = await res.json().catch((err) => {
      console.error("❌ Failed to parse JSON response:", err);
      return null;
    });

    // Log the raw response for debugging
    console.log("🔍 Raw API response data:", JSON.stringify(data, null, 2));

    if (!res.ok || data?.error) {
      console.error("❌ predictHealth response:", { status: res.status, data });
      throw new Error(data?.error || `AI prediction failed (HTTP ${res.status})`);
    }

    const predictedClass = data?.predictedClass ?? "Unknown";
    const status = data?.status as "Healthy" | "Diseased";
    const summary = {
      healthy: Number(data?.summary?.healthy ?? 0),
      diseased: Number(data?.summary?.diseased ?? 0),
      total: Number(data?.summary?.total ?? 0),
      healthIndex:
        typeof data?.summary?.health_index === "number"
          ? Number(data.summary.health_index)
          : null,
    };

    console.log("✅ prediction received:", { predictedClass, status });
    
    // Warn if we got default values
    //if (predictedClass === "Unknown" && confidence === 0) {
      //console.warn("⚠️ WARNING: Got default values (Unknown, 0%). FastAPI might not be responding correctly.");
      //console.warn("   Check your Next.js server terminal for FastAPI connection logs.");
    //}

    // Skip photo upload - only store prediction results
    console.log("2) saving prediction to Firestore (no photo storage)...");
    await addDoc(uploadsRef, {
      greenSpaceId,
      userId: user.uid,
      // No imageUrl - photo is not stored, only prediction results
      predictedClass,
      //confidence,
      status,
      createdAt: serverTimestamp(),
    });

    console.log("3) updating green space health...");
    await updateGreenSpaceHealth(greenSpaceId, status);

    console.log("DONE ✅");

    // Return prediction results (no imageUrl since we're not storing photos)
    return { predictedClass, status, summary };
  } catch (err: any) {
    // This prints the real underlying Firebase error in console
    console.error("❌ uploadLeafPhotoAndPredict error:", err);

    // throw a readable message to show in your UI
    throw new Error(err?.message || "Prediction pipeline failed");
  }
};