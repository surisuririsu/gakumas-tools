"use client";

import React, { useEffect, useRef, useState } from "react";

import { PItems, SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import * as ort from "onnxruntime-web";
import Image from "@/components/Image";

export default function CardClassifier() {
  const [session, setSession] = useState(null);
  const [embeddings, setEmbeddings] = useState({});
  const canvasRef = useRef(null);
  const [results, setResults] = useState([]);
  const [uploadedImgUrl, setUploadedImgUrl] = useState(null);

  useEffect(() => {
    const init = async () => {
      const sess = await ort.InferenceSession.create("/p_item_model.onnx");
      const res = await fetch("/p_item_embeddings.json");
      const json = await res.json();
      setSession(sess);
      setEmbeddings(json);
    };
    init();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    const imgUrl = URL.createObjectURL(file);
    setUploadedImgUrl(imgUrl);

    const img = new window.Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, 0, 0, 64, 64);
      const imageData = ctx.getImageData(0, 0, 64, 64).data;

      const input = new Float32Array(3 * 64 * 64);
      for (let i = 0; i < 64 * 64; i++) {
        input[i] = imageData[i * 4] / 255;
        input[i + 64 * 64] = imageData[i * 4 + 1] / 255;
        input[i + 2 * 64 * 64] = imageData[i * 4 + 2] / 255;
      }

      const tensor = new ort.Tensor("float32", input, [1, 3, 64, 64]);
      const output = await session.run({ input: tensor });
      const embedding = output.embedding.data;

      // Compute similarities
      const sims = Object.entries(embeddings).map(([id, emb]) => ({
        id,
        similarity: cosineSimilarity(embedding, emb),
      }));

      // Sort and take top 3
      sims.sort((a, b) => b.similarity - a.similarity);
      setResults(sims.slice(0, 10));
    };

    img.src = imgUrl;
  };

  const cosineSimilarity = (a, b) => {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        style={{ display: "none" }}
      />
      <div style={{ display: "flex", gap: "24px", marginTop: "16px" }}>
        {uploadedImgUrl && (
          <div>
            <div>Uploaded Image</div>
            <img
              src={uploadedImgUrl}
              alt="Uploaded"
              width={128}
              height={128}
              style={{ border: "1px solid #ccc", background: "#eee" }}
            />
          </div>
        )}
        {results.length > 0 && (
          <div style={{ display: "flex", gap: "16px" }}>
            {results.map((r, i) => (
              <div key={r.id}>
                <div>Match {i + 1}</div>
                {/*
                  Replace `/cards/${r.id}.jpg` with the correct path to your card images.
                  If you have a mapping from id to image URL, use that instead.
                */}
                <Image
                  src={
                    gkImg(
                      PItems.getById(r.id.split("_")[0]),
                      r.id.includes("_") ? r.id.split("_")[1] : null
                    ).icon
                  }
                  width={60}
                  height={60}
                />
                <div style={{ fontSize: "0.9em" }}>
                  {r.id}
                  <br />
                  Similarity: {r.similarity.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
