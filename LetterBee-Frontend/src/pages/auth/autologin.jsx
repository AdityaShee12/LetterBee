import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { autoLoginUser } from "../../services/auth.service.jsx";
import { useNavigate } from "react-router-dom";

const AutoLogin = () => {

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Autologin
    useEffect(() => {

        const autoLogin = async () => {
            try {
                setLoading(true);
                const response = await autoLoginUser(dispatch);
                console.log("Response", response);

                if (response?.user) {
                    navigate("/layout");
                }
            } catch (error) {
                console.log("Error : ", error);
                // navigate("/sign_in");
            }

        };

        autoLogin();
    }, []);

    return (
        <div className="font-sans min-h-screen bg-[#f0f1f8] relative overflow-hidden">
            {loading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f0f1f8] z-[100]">
                    <div className="w-[52px] h-[52px] border-[3px] border-[#3D4DB7]/20 border-t-[#3D4DB7] rounded-full animate-spin" />
                    <p className="mt-[18px] text-[#3D4DB7]/50 text-[13px] tracking-[0.12em] uppercase font-medium">Loading</p>
                </div>
            )}
        </div>
    );
}

export default AutoLogin;