import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function generateContentWithRetry(ai: any, params: any, maxRetries = 3): Promise<any> {
  let attempt = 0;
  let delay = 1000;
  
  // Try models in order of preference
  const models = [params.model || "gemini-3.5-flash", "gemini-3.1-flash-lite"];

  for (const model of models) {
    attempt = 0;
    delay = 1000;
    while (attempt < maxRetries) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: model
        });
        return response;
      } catch (err: any) {
        attempt++;
        console.warn(`Gemini generation failed (model: ${model}, attempt: ${attempt}/${maxRetries}):`, err.message || err);
        
        // If it's the last attempt of this model, don't sleep, just continue to next model/throw
        if (attempt >= maxRetries) {
          if (model === models[models.length - 1]) {
            throw err;
          }
          break; // move to fallback model
        }

        // Wait before retrying with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    apiKey = "AQ.Ab8RN6KCILCKQYf1mqY27b22HzVpjHDDvKeOL1fcAblbQPw3dA";
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // AI OCR extraction endpoint
  app.post("/api/gemini/ocr", async (req, res) => {
    try {
      if (!ai) {
        return res.status(400).json({ error: "Gemini client not initialized. Please configure GEMINI_API_KEY." });
      }
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Missing image data or mimeType" });
      }

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: image,
              mimeType: mimeType
            }
          },
          {
            text: `당신은 출입국 신분증 및 공식 문서 판독 AI입니다.
업로드된 대한민국 외국인등록증(Alien Registration Card) 또는 여권(Passport) 이미지 또는 PDF 내용을 분석하여 텍스트 정보를 추출하십시오.
반드시 정확한 대응 키값을 가지는 아래 JSON 양식에 맞춰 반환해 주십시오 (마크다운 백틱 없이 순수 JSON만 반환).

- 성명은 여권 또는 등록증에 기재된 영문 성명을 성(i_surname)과 명(i_givenname)으로 대문자로 완벽하게 분리하여 입력해주십시오.
- 날짜 형식(생년월일, 발급일, 만료일 등)은 모두 "YYYY-MM-DD" 포맷이어야 합니다.
- 외국인등록번호(i_arc)는 반드시 하이픈(-)을 포함한 13자리 형식이어야 합니다. 예: "800812-5000000".
- 여권번호(i_passport)는 문자+숫자 조합 형식입니다.
- 판독 불가능하거나 정보가 없는 항목은 공백 문자("")를 값으로 설정하십시오.

{
  "i_surname": "성 (예: BUI)",
  "i_givenname": "명 (예: QUOC TINH)",
  "i_dob": "YYYY-MM-DD",
  "i_gender": "M 또는 F",
  "i_nation": "기재된 국적명 대문자 (예: VIETNAM)",
  "i_arc": "외국인등록번호 (예: 800812-5000000)",
  "i_passport": "여권번호 (예: E03861791)",
  "i_pass_issue": "YYYY-MM-DD",
  "i_pass_exp": "YYYY-MM-DD"
}`
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No text returned from Gemini");
      }
      res.json(JSON.parse(text.trim()));
    } catch (err: any) {
      console.error("AI OCR Server Error:", err);
      res.status(500).json({ error: err.message || "Failed to perform OCR" });
    }
  });

  // AI Document Verification / Crosscheck endpoint
  app.post("/api/gemini/verify", async (req, res) => {
    try {
      if (!ai) {
        return res.status(400).json({ error: "Gemini client not initialized. Please configure GEMINI_API_KEY." });
      }
      const { documents, formData, language } = req.body;
      if (!formData) {
        return res.status(400).json({ error: "Missing formData values" });
      }

      const prompt = `당신은 대한민국 법무부 출입국·외국인정책본부 소속의 최고 정밀 비자 서류 교차 심사관(Vision AI)입니다.
업로드된 각종 증빙 서류(여권, 외국인등록증, 고용허가서, 표준근로계약서, 사업자등록증 등)의 정밀 스캔 데이터/사진들과 시스템의 [신청서 입력 데이터]를 정밀 대조하여 교차 검증하십시오.

[검증 우선 지침]
1. 사진들이 어둡고, 각도가 흔들렸거나, 빛반사가 있더라도 주변 흐름과 문자 픽셀 패턴을 추론하여 최대한 성실하게 철자 오류와 만료 기간 등을 분석하십시오.
2. 만약 입력값과 업로드된 스캔 문서에 기재된 실제 정보 간 불일치(영문 철자 하나라도 틀리거나, 생년월일 불일치, 여권번호 불일치, 임금액 단위 불일치, 사업자번호 불일치, 만료일 도래 등)가 발견되면, 즉시 에러("FAIL")를 명시하고 세부 사항을 반환하십시오.
3. 중요: 오류가 검출된 경우 반드시 에러를 수동으로 수정할 수 있도록 리액트 UI 입력 필드 ID와 1:1로 매칭되는 'fieldId' 값을 기재해주십시오.
   예를 들어 Surname이 다르면 'i_surname', Given Name이 다르면 'i_givenname', 생년월일이 다르면 'i_dob', 등록번호가 다르면 'i_arc', 여권번호가 다르면 'i_passport', 한국주소가 다르면 'i_address_kr', 회사명이 다르면 'i_cname', 사업자번호가 다르면 'i_cregno', 대표자명이 다르면 'i_rep_name', 대표자주민번호가 다르면 'i_rep_id', 회사주소가 다르면 'i_caddr', 연소득이 다르면 'i_income', 기숙사 입주일이 다르면 'i_dorm_start'로 설정하십시오.
4. 설명('description') 및 권장조치('recommendation') 항목의 텍스트는 사용자가 요청한 현재 인터페이스 언어[${language || 'Korean'}]로 자연스럽고 친절하며 명확하게 번역 및 해설하여 작성하십시오.

[신청서 입력 데이터]
${JSON.stringify(formData, null, 2)}

반드시 responseSchema 데이터 구조에 완벽히 상호 호환되는 형식으로 JSON만 반환해주십시오.`;

      const contents: any[] = [{ text: prompt }];

      if (documents && Array.isArray(documents)) {
        for (const doc of documents) {
          if (doc && doc.data && doc.mimeType) {
            contents.push({
              inlineData: {
                data: doc.data,
                mimeType: doc.mimeType
              }
            });
          }
        }
      }

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              status: { 
                type: "STRING" as any,
                description: "PASS (일치) or FAIL (불일치/경고)"
              },
              issues: {
                type: "ARRAY" as any,
                description: "검출된 각 불일치 내역 정보 리스트",
                items: {
                  type: "OBJECT" as any,
                  properties: {
                    fieldId: { 
                      type: "STRING" as any,
                      description: "오류가 발견된 화면의 입력 필드 ID (예: i_surname, i_givenname, i_dob, i_arc, i_passport, i_cregno, i_income). 없을 경우 빈칸" 
                    },
                    category: { 
                      type: "STRING" as any,
                      description: "불일치 대분류 항목"
                    },
                    description: { 
                      type: "STRING" as any,
                      description: "검출 원인 설명"
                    },
                    recommendation: { 
                      type: "STRING" as any,
                      description: "올바른 형태로 조치 및 수정해야 할 가이드라인"
                    }
                  },
                  required: ["fieldId", "category", "description", "recommendation"]
                }
              }
            },
            required: ["status", "issues"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response returned from Gemini validation model");
      }
      res.json(JSON.parse(text.trim()));
    } catch (err: any) {
      console.error("AI Verify Server Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze document verification" });
    }
  });

  // Serve static files / Vite client in production / dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
