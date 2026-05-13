# Báo Cáo Phân Tích Dự Án OTT Education

Dựa trên yêu cầu từ file `DoAnMonHoc2025.pdf` và mã nguồn hiện tại, dưới đây là bảng phân tích chi tiết về trạng thái của dự án.

## 1. Tổng Quan
Dự án là một hệ thống OTT cho giáo dục với Backend Spring Boot và Frontend ReactJS.
*   **Backend**: Spring Boot, MongoDB, WebSocket, JWT, Cloudinary.
*   **Frontend**: ReactJS (Vite), MUI, WebSocket (Stomp).

## 2. Trạng Thái Các Chức Năng Cốt Lõi (Bắt Buộc)

| Chức Năng | Yêu Cầu (PDF) | Trạng Thái Hiện Tại | Ghi Chú |
| :--- | :--- | :--- | :--- |
| **1. Quản lý người dùng & nhóm** | | | |
| Đăng ký / Đăng nhập | Có | ✅ Đã hoàn thiện | Có `AuthenticationController`, JWT. |
| Quản lý hồ sơ | Có | ✅ Đã hoàn thiện | `UserController`, `ProfileModal` (FE). |
| Tạo & quản lý nhóm | Có | ✅ Đã hoàn thiện | `GroupController`, `GroupService`. |
| **2. Chức năng Chat** | | | |
| Chat 1-1 và Group | Có | ✅ Đã hoàn thiện | `ChatController`, `MessageController`. |
| Gửi Text, Image | Có | ✅ Đã hoàn thiện | Hỗ trợ qua Cloudinary. |
| Gửi Video, Document | Có | ✅ Đã hoàn thiện | Có MessageType `VIDEO`, `FILE`. |
| Gửi Emoji | Có | ✅ Đã hoàn thiện | Frontend có `emoji-picker-react`. |
| Lưu lịch sử chat | Có | ✅ Đã hoàn thiện | Lưu trong MongoDB (Message collection). |
| Có tính năng Video Call | (Không bắt buộc nhưng tốt) | ✅ Đã có (Bonus) | Có `CallController`, WebRTC. |
| **3. Chatbot & AI (Cơ bản)** | | | |
| Chatbot trả lời tự động | **BẮT BUỘC** | ❌ **CHƯA CÓ** | Chưa thấy Controller/Service nào liên quan đến AI/Chatbot. |
| Áp dụng AI mô phỏng/API | **BẮT BUỘC** | ❌ **CHƯA CÓ** | Chưa tích hợp OpenAI hoặc chatbot logic nào. |
| **4. Thống kê & Phân tích** | | | |
| Số lượng tin nhắn | **BẮT BUỘC** | ❌ **CHƯA CÓ** | Chưa có API thống kê. |
| Mức độ hoạt động user | **BẮT BUỘC** | ❌ **CHƯA CÓ** | Chưa có API thống kê. |
| Thống kê nhóm chat | **BẮT BUỘC** | ❌ **CHƯA CÓ** | Chưa có Dashboard UI. |

## 3. Các Yêu Cầu Khác
*   **Kiến trúc Layout**: Đã tách biệt API và UI khá tốt.
*   **Cloud Deployment**:
    *   Yêu cầu: Deploy lên Cloud miễn phí (Render, Vercel, Railway...).
    *   Hiện tại: Có `Dockerfile`, sẵn sàng để deploy.
    *   Ghi chú: Cần ưu tiên phần này (điểm cộng).

## 4. Đề Xuất Cần Làm Ngay
Để hoàn thiện đồ án theo yêu cầu, bạn cần bổ sung gấp 2 module sau:

### Module 1: Chatbot AI (Cơ bản)
*   **Backend**:
    *   Tạo `ChatbotController`.
    *   Tích hợp API OpenAI (hoặc Gemini/HuggingFace free tier) hoặc viết logic rule-based đơn giản (if keyword match -> reply).
    *   Flow: User gửi tin nhắn tới "Chatbot User" -> Backend nhận -> Gọi AI Service -> Trả lời.
*   **Frontend**:
    *   Thêm một mục "Trợ lý ảo" hoặc cho phép chat với bot như một user bình thường.

### Module 2: Thống kê (Dashboard)
*   **Backend**:
    *   Tạo `StatisticsController`.
    *   API `GET /api/stats/overview`: Trả về tổng user, tổng message.
    *   API `GET /api/stats/activity`: Trả về số message theo ngày.
*   **Frontend**:
    *   Tạo trang `/admin/dashboard` hoặc `/stats`.
    *   Hiện biểu đồ (dùng thư viện `recharts` hoặc `chart.js`).

## 5. Kết Luận
Dự án đã hoàn thành khoảng **70-80%** khối lượng công việc (phần Core khó nhất đã xong). Tuy nhiên, **20-30% còn lại (AI & Thống kê)** là bắt buộc để đạt điểm tối đa và không bị trừ điểm theo barem.
