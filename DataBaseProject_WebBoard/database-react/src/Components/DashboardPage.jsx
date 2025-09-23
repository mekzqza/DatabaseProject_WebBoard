import { useNavigate } from "react-router-dom";

function DashboardPage() {
    const navigate = useNavigate();  // ใช้ useNavigate เพื่อเปลี่ยนหน้า

    // ฟังก์ชันสำหรับการออกจากระบบ
    const handleLogout = () => {
        // ในกรณีนี้ เราจะเพียงแค่ไปที่หน้า LoginPage หลังจากออกจากระบบ
        // ในทางปฏิบัติ คุณอาจจะลบข้อมูลที่เกี่ยวข้องกับการเข้าสู่ระบบ เช่น token
        navigate("/");  // เปลี่ยนหน้าไปที่หน้า Login
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>Welcome to your Dashboard!</h2>
            <p>You are logged in.</p>
            <button onClick={handleLogout}>Logout</button>  {/* ปุ่ม Logout */}
        </div>
    );
}

export default DashboardPage;
