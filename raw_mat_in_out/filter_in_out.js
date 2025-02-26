import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<500"], // 95% ของคำขอควรตอบกลับในเวลาไม่เกิน 500ms
    "http_req_duration{status:200}": ["p(90)<400"], // 95% ของคำขอที่สถานะ 200 ควรตอบกลับในเวลาไม่เกิน 400ms
    http_reqs: ["count>100000"], // จำนวนคำขอทั้งหมดควรเกิน 100,000
    checks: ["rate>0.90"], // 95% ของการตรวจสอบ (checks) ควรผ่าน
  },
};

const BASE_URL = "http://203.154.184.162:5012/api/material/filterInOut";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA1Mzc1OTIsImV4cCI6MTc0MDYyMzk5Mn0.OMOpNI0ygR_FjX6XYLl2Sz7r-DLyxEX-ShCYJy8g5o4";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// 🔹 Payload ที่ต้องส่งไปกับคำขอ POST
const payload = JSON.stringify({
  material_no: "",
  material_name: "",
  material_type_id: "",
  material_spec_id: "",
  material_size_id: "",
  material_supplier_id: "",
  oem_id: "e9549a12-9b0d-4b10-b2ef-ac3607c42ab4",
  company_id: "1a947e52-07ad-44fb-baca-aa24741512c3",
  page: 1,
  size: 10,
  search: "",
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
