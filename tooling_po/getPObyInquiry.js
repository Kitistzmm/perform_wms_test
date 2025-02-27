import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "5m", target: 5000 },
    { duration: "5m", target: 10000 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<500"],
    "http_req_duration{status:200}": ["p(90)<400"],
    http_reqs: ["count>100000"],
  },
};

const BASE_URL =
  "http://203.154.184.162:5012/api/toolingInquiry/getPOByInquiry";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA2MjQ0NzgsImV4cCI6MTc0MDcxMDg3OH0.ZiDS9D7p1q0gF0SK_dGGUKhhsa_2UEquRz0rpGIEd_g";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// 🔹 Payload ที่ต้องส่งไปกับคำขอ POST
const payload = JSON.stringify({
  ti_inquiry_id: "a9983cf3-c6e6-4f9d-a9b1-91a163002578",
  oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
  company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
});

// 🔹 Headers ที่ใช้
const params = {
  headers: {
    "Content-Type": "application/json",
    Authorization: AUTH_TOKEN,
    "X-TTT-PMRP": X_TTT_PMRP,
  },
};

export default function () {
  // 🔹 ส่งคำขอ POST
  const response = http.post(BASE_URL, payload, params);

  // 🔹 Log ข้อมูลแต่ละ Status เพื่อให้วิเคราะห์ผลลัพธ์ง่ายขึ้น
  console.log(
    `🔍 Status: ${response.status} | ⏳ Response Time: ${response.timings.duration} ms`
  );

  if (response.status === 200) {
    console.log(`✅ SUCCESS: 200 | ⏳ ${response.timings.duration} ms`);
  } else if (response.status >= 400 && response.status < 500) {
    console.log(
      `⚠️ CLIENT ERROR: ${response.status} | ⏳ ${response.timings.duration} ms | ❗ Message: ${response.body}`
    );
  } else if (response.status >= 500) {
    console.log(
      `❌ SERVER ERROR: ${response.status} | ⏳ ${response.timings.duration} ms | 🔥 อาจเกิดจากโหลดสูงหรือ API ล่ม`
    );

    sleep(1);
  }

  // 🔹 ตรวจสอบค่าที่ได้
  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "response is not empty": (r) => r.body && r.body.length > 0,
  });
}
