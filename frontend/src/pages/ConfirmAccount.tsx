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
                    src="data:image/png;base64,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"
                    alt="Logo JJodel"
                    style={styles.logo}
                />
                <h1 style={styles.title}>
                    Confirm your Account ✉️
                </h1>
                <p style={styles.paragraph}>
                   Please confirm your email address to activate your account and start using the platform.
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
                        Confirm Account
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
