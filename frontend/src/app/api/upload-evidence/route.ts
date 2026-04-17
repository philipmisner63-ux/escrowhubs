import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT ?? "";
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY ?? "https://gateway.pinata.cloud";

export async function POST(req: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json({ error: "IPFS upload not configured" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;
    const escrowAddress = formData.get("escrowAddress") as string | null;
    const submitter = formData.get("submitter") as string | null;

    if (!text && !file) {
      return NextResponse.json({ error: "No file or text provided" }, { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!file || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large or missing" }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    }

    // Build evidence JSON to pin
    const evidenceJson: Record<string, unknown> = {
      version: "1",
      escrowAddress,
      submitter,
      timestamp: new Date().toISOString(),
      text: text?.trim() || null,
      attachments: [] as Array<{ name: string; type: string; ipfsHash: string; url: string }>,
    };

    // If file provided, upload it to Pinata first
    if (file) {
      const fileFormData = new FormData();
      fileFormData.append("file", file, file.name);
      fileFormData.append("pinataMetadata", JSON.stringify({
        name: `evidence-${escrowAddress}-${Date.now()}-${file.name}`,
        keyvalues: { escrowAddress: escrowAddress ?? "", submitter: submitter ?? "" },
      }));
      fileFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const fileRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: fileFormData,
      });

      if (!fileRes.ok) {
        const err = await fileRes.text();
        console.error("Pinata file upload error:", err);
        return NextResponse.json({ error: "File upload to IPFS failed" }, { status: 502 });
      }

      const fileData = await fileRes.json();
      const fileHash = fileData.IpfsHash;
      (evidenceJson.attachments as Array<{ name: string; type: string; ipfsHash: string; url: string }>).push({
        name: file.name,
        type: file.type,
        ipfsHash: fileHash,
        url: `${PINATA_GATEWAY}/ipfs/${fileHash}`,
      });
    }

    // Pin the evidence JSON
    const jsonRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: evidenceJson,
        pinataMetadata: {
          name: `evidence-${escrowAddress}-${Date.now()}`,
          keyvalues: { escrowAddress: escrowAddress ?? "", submitter: submitter ?? "", type: "evidence" },
        },
        pinataOptions: { cidVersion: 1 },
      }),
    });

    if (!jsonRes.ok) {
      const err = await jsonRes.text();
      console.error("Pinata JSON pin error:", err);
      return NextResponse.json({ error: "Failed to pin evidence to IPFS" }, { status: 502 });
    }

    const jsonData = await jsonRes.json();
    const cid = jsonData.IpfsHash;
    const uri = `ipfs://${cid}`;
    const gatewayUrl = `${PINATA_GATEWAY}/ipfs/${cid}`;

    return NextResponse.json({ uri, cid, gatewayUrl });

  } catch (err) {
    console.error("upload-evidence error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
