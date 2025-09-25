import {useNavigate, useParams} from "react-router-dom";
import {AuthApi} from "../api/persistance";
import {ConfirmAccountRequest} from "../api/DTO/ConfirmAccountRequest";
import {useEffect, useState} from "react";


function ConfirmAccount() {
    const { id, token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const confirmAccount = () => {
        setLoading(true);
        try {
            const confirmAccount: ConfirmAccountRequest = new ConfirmAccountRequest();
            confirmAccount.token = token;
            confirmAccount.userId = id;
            AuthApi.confirmAccount(confirmAccount).then(() => {

                setTimeout(() => {
                    navigate("/");
                }, 2000);
            }).catch(() => {
                setLoading(false)

            });
        } catch (e) {
            console.log("Errore nella conferma account:", e);
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>

                <img
                    src="https://www.jjodel.io/wp-content/uploads/2024/06/logo-pride.png"
                    alt="Logo JJodel"
                    style={styles.logo}
                />
                <h1 style={styles.title}>
                    Confirm your Account ✉️
                </h1>
                <p style={styles.paragraph}>
                    Click the button below to confirm your email and start using the platform.
                </p>

                {loading ? (
                    <p style={styles.loadingText}>Conferma in corso... 🔄</p>
                ) : (
                    <button
                        onClick={confirmAccount}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        style={styles.button}
                    >
                        Conferma Account
                    </button>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'white',
        color: 'white',
        padding: '1rem',
    },
    card: {
        backgroundColor: 'white',
        color: '#1f2937',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center' as const,
    },
    logo: {
        width: '120px',
        marginBottom: '1.5rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold' as const,
        marginBottom: '1rem',
    },
    paragraph: {
        marginBottom: '1.5rem',
        fontSize: '1rem',
    },
    button: {
        backgroundColor: '#2563eb',
        color: 'white',
        fontWeight: '600',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.75rem',
        width: '100%',
        fontSize: '1.125rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    loadingText: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#2563eb',
    }
};


export { ConfirmAccount };
