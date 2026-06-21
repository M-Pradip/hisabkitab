import crypto from "node:crypto";

function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing Cloudinary env var: ${name}`);
  }

  return value;
}

function buildSignature(params, apiSecret) {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export function getCloudinaryConfig() {
  return {
    cloudName: getEnv("cloudinary_cloud_name"),
    apiKey: getEnv("cloudinary_api_key"),
    apiSecret: getEnv("cloudinary_api_secret"),
  };
}

export async function uploadCloudinaryImage({ file, folder }) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildSignature({ folder, timestamp }, apiSecret);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(
      data?.error?.message || "Unable to upload the QR image to Cloudinary.",
    );
  }

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
    assetId: data.asset_id || "",
  };
}

export async function destroyCloudinaryImage(publicId) {
  if (!publicId) {
    return false;
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = buildSignature({ public_id: publicId, timestamp }, apiSecret);
  const formData = new FormData();

  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("invalidate", "true");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(
      data?.error?.message || "Unable to delete the QR image from Cloudinary.",
    );
  }

  return data.result === "ok";
}
