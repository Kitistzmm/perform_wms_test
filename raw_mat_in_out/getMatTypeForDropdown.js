import http from "k6/http";
import { check, sleep } from "k6";

// ✅ 1️⃣ การตั้งค่าการทดสอบ (Performance Test Configuration)
export const options = {
  stages: [
    { duration: "30s", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(90)<500"], // 90% ของคำขอต้องใช้เวลาน้อยกว่า 500ms
    "http_req_duration{status:200}": ["p(90)<400"], // 90% ของคำขอสถานะ 200 ใช้เวลาน้อยกว่า 400ms
    http_reqs: ["count>100000"], // จำนวนคำขอทั้งหมดต้องมากกว่า 100,000
    checks: ["rate>0.90"], // 90% ของเงื่อนไขต้องผ่าน
  },
};

// ✅ 2️⃣ การกำหนดค่าตัวแปรและ Headers (Environment Variables)
const BASE_URL =
  "http://203.154.184.162:5012/api/materialType/getMatTypeForDropdown";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eUlEIjoiZmExY2VjMjAtOTc0NC00ZWUzLWFhNmQtM2Y4MTcyZTEwYTcwIiwiZmlyc3RuYW1lIjoiS2lzc2FkYXBhIiwibGFzdG5hbWUiOiJOZ3VhbmNob24iLCJjb21wYW55SUQiOiIiLCJpYXQiOjE3NDA1Mzc1OTIsImV4cCI6MTc0MDYyMzk5Mn0.OMOpNI0ygR_FjX6XYLl2Sz7r-DLyxEX-ShCYJy8g5o4";
const X_TTT_PMRP = "ecffd46cf0f300f79f21afcac734ea9c";

// ค่าเฉพาะของผู้ใช้ (Dynamic Parameters)
const oem_id = "ad5431b1-4136-4695-a1c2-7fe02b137d68";
const company_id = "1a947e52-07ad-44fb-baca-aa24741512c3";

// ✅ 3️⃣ ฟังก์ชันช่วยเหลือ (Helper Functions)
function getRequestParams() {
  return {
    headers: {
      Authorization: AUTH_TOKEN,
      "X-TTT-PMRP": X_TTT_PMRP,
    },
  };
}

// ✅ 4️⃣ ฟังก์ชันหลัก (Main Load Test Function)
export default function () {
  const url = `${BASE_URL}/${company_id}/${oem_id}`;
  const params = getRequestParams();

  // ส่ง Request ไปที่ API
  const response = http.get(url, params);

  // ✅ 5️⃣ การตรวจสอบผลลัพธ์ (Validation & Logging)
  logRequest(url, response);
  validateResponse(response);

  // ✅ 6️⃣ เพิ่ม sleep() เพื่อป้องกันการยิง Request รัวๆ
  sleep(1); // หยุด 1 วินาทีต่อ 1 Iteration
}

// 📌 ฟังก์ชัน: บันทึกข้อมูลการ Request
function logRequest(url, response) {
  console.log(`🟢 [Request] URL: ${url}`);
  console.log(
    `📡 [Response] Status: ${response.status} | Time: ${response.timings.duration}ms`
  );

  // แจ้งเตือนหากเซิร์ฟเวอร์ล่ม
  if (response.status >= 500) {
    console.error(`🔥 [ERROR] Server Down! Status: ${response.status}`);
  }
}

// 📌 ฟังก์ชัน: ตรวจสอบผลลัพธ์ของการทดสอบ
function validateResponse(response) {
  check(response, {
    "✅ Status is 200": (r) => r.status === 200,
    "⏱ Response time < 500ms": (r) => r.timings.duration < 500,
  });
}
