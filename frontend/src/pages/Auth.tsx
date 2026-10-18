import {FormEvent, JSX, useEffect} from 'react';
import {useStateIfMounted} from 'use-state-if-mounted';
import type {Dictionary, DocString, GObject, Pointer} from '../joiner';
import {Log, DUser, R, SetRootFieldAction, U} from '../joiner';
import Storage from '../data/storage';
import {AuthApi, UsersApi} from "../api/persistance";
import logo from '../static/img/logo-light-150.png'; // dark wordmark, as in Navbar.tsx; jjodel.png is white
import {Tooltip} from '../components/forEndUser/Tooltip';
import { RegisterRequest } from '../api/DTO/RegisterRequest';
import { LoginRequest } from '../api/DTO/LoginRequest';
import { TokenResponse } from '../api/DTO/TokenResponse';
import {ResetPasswordRequest} from "../api/DTO/ResetPasswordRequest";
import { BrowserWarningModal } from '../components/BrowserWarningModal';
import {
    detectBrowser,
    shouldShowBrowserWarning,
    markBrowserWarningShown
} from '../utils/browserDetection';
import "./auth.scss"

// Import partner logos
import logoUnivaq from '../static/img/partners/univaq.png';
import logoMdu from '../static/img/partners/mdu.svg';
import logoFbk from '../static/img/partners/fbk.png';
import Api from "../api/api";
import {APP_VERSION} from '../version';

// Editorial copy of the auth page. Adding a university is a one-line change in AUTH_ADOPTION.
const AUTH_ADOPTION: {label: string, entries: string[]}[] = [
    {label: 'Teaching', entries: [
        "University of L'Aquila (Italy)",
        'Mälardalen University (Sweden)',
        'McMaster University (Canada)',
        'An-Najah National University (Palestine)',
    ]},
    {label: 'Research', entries: [
        'European projects AIM-PRO and PISAI',
    ]},
];

const AUTH_PILLARS: {title: string, text: string}[] = [
    {title: 'Metamodels', text: 'Languages and the models that conform to them.'},
    {title: 'Viewpoints', text: 'Several notations for the same model.'},
    {title: 'Transformations', text: 'Model to model, with JjTL.'},
];

const TERMS_URL = 'https://jjodel.io/terms/';
const PRIVACY_URL = 'https://jjodel.io/app-privacy/';
const VERSION_MAJOR_MINOR = APP_VERSION.split('.').slice(0, 2).join('.');

// Left column of the main band: product statement, pillars, adoption.
// In the register view (wide screens) the pillars and adoption are hidden by CSS and the privacy note is shown.
const AuthIntro = ({register}: {register: boolean}) => (
    <div className="auth-page__intro">
        <div className="auth-page__eyebrow">
            <span className="auth-page__eyebrow-mark" aria-hidden="true" />
            Jjodel {VERSION_MAJOR_MINOR}
        </div>
        <h2 className="auth-page__title">The modeling workbench for research and teaching.</h2>
        <p className="auth-page__subtitle">
            Metamodels and models side by side, with viewpoints, transformations and an AI assistant. Open source, in the browser.
        </p>
        {register && <p className="auth-page__privacy-note">
            Your name and nickname are shown to the people you share projects with. Your email is never shown.
        </p>}
        <div className="auth-page__pillars">
            {AUTH_PILLARS.map(p => (
                <div className="auth-page__pillar" key={p.title}>
                    <div className="auth-page__pillar-title">{p.title}</div>
                    <div className="auth-page__pillar-text">{p.text}</div>
                </div>
            ))}
        </div>
        <dl className="auth-page__adoption">
            {AUTH_ADOPTION.map(a => [
                <dt className="auth-page__adoption-label" key={a.label + '-l'}>{a.label}</dt>,
                <dd className="auth-page__adoption-value" key={a.label + '-v'}>{a.entries.join(', ')}</dd>
            ])}
        </dl>
    </div>
);

const AuthFooter = () => (
    <footer className="auth-page__footer">
        <div className="auth-page__container auth-page__footer-inner">
        <div className="auth-page__partners">
            <img className="auth-page__partner auth-page__partner--univaq" src={logoUnivaq} alt="Università degli Studi dell'Aquila" />
            <img className="auth-page__partner" src={logoMdu} alt="Mälardalens universitet" />
            <img className="auth-page__partner" src={logoFbk} alt="Fondazione Bruno Kessler" />
        </div>
        <div className="auth-page__meta">
            <a className="auth-page__terms" href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms</a>
            <a className="auth-page__terms" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">Privacy</a>
            <span className="auth-page__version">v{APP_VERSION}</span>
        </div>
        </div>
    </footer>
);

const passPattern = '^.{8,}$'; //'^[^\\s].{10,}[^\\s]$';
function AuthPage(): JSX.Element {
    const [action, setAction] = useStateIfMounted<'login'|'register'|'retrieve-password'>('login');
    const [nickname, setNickname] = useStateIfMounted('');
    const [name, setName] = useStateIfMounted('');
    const [surname, setSurname] = useStateIfMounted('');
    const [affiliation, setAffiliation] = useStateIfMounted('');
    const [country, setCountry] = useStateIfMounted('Italy');
    const [email, setEmail] = useStateIfMounted('');
    const [password, setPassword] = useStateIfMounted('');
    const [passwordCheck, setPasswordCheck] = useStateIfMounted('');
    const [isDirty, setDirty] = useStateIfMounted(false);
    const [dirtyStatuses, setDirtyStatuses] = useStateIfMounted<Dictionary<string, boolean>>({});

    // Browser warning state
    const [showBrowserWarning, setShowBrowserWarning] = useStateIfMounted(false);
    const [browserName, setBrowserName] = useStateIfMounted('');

    // Check browser on mount
    useEffect(() => {
        if (shouldShowBrowserWarning()) {
            const browser = detectBrowser();
            setBrowserName(browser.name);
            setShowBrowserWarning(true);
        }
    }, []);

    // Handler to close browser warning
    const handleCloseBrowserWarning = () => {
        markBrowserWarningShown();
        setShowBrowserWarning(false);
    };

    const dirty = (e: React.MouseEvent<HTMLInputElement | HTMLSelectElement>)=>{
        /* for real-time validation while you write the form, disabled for now
        let name = (e.target as HTMLElement)?.getAttribute?.('name')||'';
        setDirtyStatuses({...dirtyStatuses, [name]: true});
         */
    }

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let dosubmit = async () => { // main function needs to stay not async or prevent default won't work (it doubles navigation and API calls triggered)
            SetRootFieldAction.new('isLoading', true);
            let success: boolean = false;
            switch (action) {
                case 'login':
                    success = await login();
                    SetRootFieldAction.new('isLoading', false);
                    break;
                case 'register':
                    success = await register();
                    SetRootFieldAction.new('isLoading', false);
                    break;
                case 'retrieve-password':
                    success = await reset_password();
                    SetRootFieldAction.new('isLoading', false);
                    break;
            }
            setDirty(!success);
        }
        // try { dosubmit(); } catch (error) { Log.eDevv('Submit error', error) } should never catch an error on async
        dosubmit();
        return false;
    }

    const reset_password = async (): Promise<boolean> => {

        try {
            const resetPasswordRequest = new ResetPasswordRequest();
            resetPasswordRequest.email = email;
            const response: GObject = await AuthApi.reset_password(resetPasswordRequest);

            if ((response.code+'')[0] !== '2') {
                let title: string = response.data?.title;
                let msg: string = response.data?.description;
                U.alert('e', title || (response.data as any as string), msg);
                return false;
            }
            else {
                U.alert('i', <>Password reset link sent</>, <>Check your <a href={'//'+(email.split('@')?.[1])}>inbox</a> for
                    the reset link.<br/>If it’s not there, look in Spam/Junk.</>);
            }

        } catch (e) {
            console.error("Error in reset password request:", e);
            U.alert('e', 'Request failed, please describe and report the issue at info@jjodel.io', ''); //The error has already been reported.', '');
            // todo: we need to make auto-error report, then attach it here
            return false;
        }
        return true;
    }

    const login   = async (): Promise<boolean> => {
        try {
            const loginRequest = new LoginRequest();
            loginRequest.email = email;
            loginRequest.password = password;

            const response: GObject = await AuthApi.login(loginRequest);
            const raw: TokenResponse | null = response.data;

            // console.log('login debug', {loginRequest, response, raw, env: process.env, ue: U.env("")});

            if ((response.code+'')[0] !== '2') {
                let title: string = response.data?.title;
                let msg: string = response.data?.description;
                U.alert('e', title || (response.data as any as string), msg);
                return false;
            }
            else {
                // U.alert('i', <>Login successful</>, <>You are being redirected to your <a href={'//#/allProjects'}>dashboard</a></>);
            }

            if (!raw?.token || typeof raw.token !== 'string') {
                console.error('login failed', {raw});
                U.alert('e', 'Login failed or invalid token.', '');
                return false; }

            const claims = AuthApi.readJwtToken(raw.token);
            // console.log('login claims', {response, raw, claims});
            if (!claims) { U.alert('e', 'Invalid token.', ''); return false; }
            let te = new Date(raw.expires as unknown as string).getTime();
            let rte = new Date(raw.refreshTokenExpiryTime as unknown as string).getTime();

            Api.storeSessionData(raw.token, te, raw.refreshToken||'', rte, undefined);
            if (isNaN(new Date(raw.refreshTokenExpiryTime as any as string).getTime())) console.error('invalid refresh token expiry date:'+raw.refreshTokenExpiryTime, raw);

            // const user: DUser = DUser.new(claims.name, '', claims.nickname, '',  '', false, claims.email,  raw.token, claims._Id, claims.id, true);
            const user: DUser|null = await UsersApi.getUserByGUID(claims.id);
            // name-surname error is on server-side get or set. not on client side.
            /*if ((window as any).debug1 && user && user.surname === user.name) {
                // console.log('error name debug', {user});
                return;
            }*/
            if (!user) {
                Log.ee('Login failed, cannot load user data.', {user, raw});
                U.alert('e', 'Login failed, cannot load user data.', '');
                // todo: report error
                return false;
            }
            Storage.write('user', user);
            //U.resetState();
            if (window.location.hash.indexOf('#/auth') !== 0) R.refresh()
            else R.navigate('/allProjects');
        } catch (e) {
            Log.ee('Unexpected error during login.', {e});
            U.alert('e', 'Unexpected error during login.', '');
            // todo: report error
            return false;
        }
        return true;
      };

    const register = async(): Promise<boolean> => {
        if (password !== passwordCheck) {
            U.alert('e', 'The two passwords are different', '');
            return false;
        }
        const registerRequest : RegisterRequest = new RegisterRequest();
        registerRequest.Name = name;
        registerRequest.Surname = surname;
        registerRequest.Country = country;
        registerRequest.Affiliation = affiliation;
        registerRequest.Nickname = nickname;
        registerRequest.Email = email;
        registerRequest.Password = password;
        // console.log(registerRequest);
        const response: GObject = await AuthApi.register(registerRequest);

        if ((response.code+'')[0] !== '2') {
            let title: string = response.data?.title;
            let msg: string = response.data?.description;
            U.alert('e', title || (response.data as any as string), msg);
            return false;
        }
        else {
            U.alert('w', <>Welcome to Jjodel!</>, <>Check your <a href={'//'+(email.split('@')?.[1])}>inbox</a> for the activation link.<br/>If it’s not there, look in Spam/Junk.<br/>You can close this tab.</>);
        }

        const data = U.wrapper<DUser>(response.data);
        Storage.write('token', data.token);
        const user = DUser.new(data.name, data.surname, data.nickname, data.affiliation, data.country, data.newsletter || false, data.email, data.token, data.id, data._Id);
        Storage.write('user', user);
        Storage.write('offline', false);
        // R.navigate('/allProjects');
        U.resetState();
        return true;
    }

const offline = () => {
    AuthApi.offline();
    R.navigate('/allProjects');
    // U.resetState();
}

return(<section className={`auth-page ${action === 'register' ? 'register' : action === 'retrieve-password' ? 'retrieve' : ''} `+(isDirty?' dirty':'')}>

    <header className="auth-page__header">
        <div className="auth-page__container auth-page__header-inner">
        <img className="auth-page__logo" src={logo} alt="Jjodel" />
        <nav className="auth-page__nav">
            <a className="auth-page__nav-link" href="https://docs.jjodel.io" target="_blank" rel="noopener noreferrer">Documentation</a>
            <a className="auth-page__github" href="https://github.com/jjodel-modeling/jjodel-frontend" target="_blank" rel="noopener noreferrer" aria-label="Jjodel on GitHub">
                <i className="bi bi-github" aria-hidden="true" />
            </a>
            {action === 'login'
                ? <button className="auth-page__switch" type="button" onClick={() => setAction('register')}>Register</button>
                : <button className="auth-page__switch" type="button" onClick={() => setAction('login')}>Sign in</button>}
        </nav>
        </div>
    </header>

    <main className="auth-page__main">
        <div className="auth-page__container auth-page__grid">
        <AuthIntro register={action === 'register'} />

        <form className={'auth-form auth-card'} onSubmit={onSubmit}>
            <div className="auth-card__head">
                <h1 className="auth-card__title">
                    {action === 'register' && 'Create an account'}
                    {action === 'login' && 'Sign in'}
                    {action === 'retrieve-password' && 'Reset your password'}
                </h1>
                {action === 'register' && <p className="auth-card__lead">It takes a minute.</p>}
                {action === 'login' && <p className="auth-card__lead">Continue to your projects.</p>}
                {action === 'retrieve-password' && <p className="auth-card__lead">We will send a reset link to your email.</p>}
            </div>

        {action === 'register' && <>

            {/* REGISTRATION */}

            <div className="auth-card__fields">
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>First Name</h6>Your first name will be visible to others whenever you interact with them, such as during collaboration on shared projects.</div>} >
                    <label>
                        First Name
                        <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                            placeholder={'john'}
                            value={name}
                            onClick={dirty}
                            onChange={e => setName(e.target.value)}
                            type={'text'} required={true} title={'required'}
                        />
                    </label>
                </Tooltip>

                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Last Name</h6>Your last name will be visible to others whenever you interact with them, such as during collaboration on shared projects.</div>} >
                    <label>
                        Last Name
                        <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                               placeholder={'doe'}
                               value={surname}
                               onClick={dirty}
                               onChange={e => setSurname(e.target.value)}
                               type={'text'} required={true} title={'required'}
                        />
                    </label>
                </Tooltip>

                    <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Nickname</h6>Your nickname will be visible to others whenever you interact with them, such as during collaboration on shared projects.</div>} >
                        <label>
                            Nickname
                            <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                                   placeholder={''}
                                   value={nickname}
                                   onClick={dirty}
                                   onChange={e => setNickname(e.target.value)}
                                   type={'text'} required={true} title={'required'}
                            />
                        </label>
                    </Tooltip>

                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Affiliation</h6>Your affiliation refers to the organization, institution, or company you’re associated with, will be displayed in relevant contexts like project collaborations or professional interactions, and will help us keep track of where jjodel is being used.</div>} ><label>
                    Affiliation
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                        placeholder={'eg: univaq'}
                        value={affiliation}
                        onClick={dirty}
                        onChange={e => setAffiliation(e.target.value)}
                        type={'text'} required={false}
                    />
                    </label>
                </Tooltip>
                <label>
                    <label>Country</label>
                    <select className={"form-control"} defaultValue={country}
                            onClick={dirty}
                            onChange={e => setCountry(e.target.value)}>
                        <option value="Afghanistan">Afghanistan</option>
                        <option value="Åland Islands">Åland Islands</option>
                        <option value="Albania">Albania</option>
                        <option value="Algeria">Algeria</option>
                        <option value="American Samoa">American Samoa</option>
                        <option value="Andorra">Andorra</option>
                        <option value="Angola">Angola</option>
                        <option value="Anguilla">Anguilla</option>
                        <option value="Antarctica">Antarctica</option>
                        <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Armenia">Armenia</option>
                        <option value="Aruba">Aruba</option>
                        <option value="Australia">Australia</option>
                        <option value="Austria">Austria</option>
                        <option value="Azerbaijan">Azerbaijan</option>
                        <option value="Bahamas">Bahamas</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Barbados">Barbados</option>
                        <option value="Belarus">Belarus</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Belize">Belize</option>
                        <option value="Benin">Benin</option>
                        <option value="Bermuda">Bermuda</option>
                        <option value="Bhutan">Bhutan</option>
                        <option value="Bolivia">Bolivia</option>
                        <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                        <option value="Botswana">Botswana</option>
                        <option value="Bouvet Island">Bouvet Island</option>
                        <option value="Brazil">Brazil</option>
                        <option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
                        <option value="Brunei Darussalam">Brunei Darussalam</option>
                        <option value="Bulgaria">Bulgaria</option>
                        <option value="Burkina Faso">Burkina Faso</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Cambodia">Cambodia</option>
                        <option value="Cameroon">Cameroon</option>
                        <option value="Canada">Canada</option>
                        <option value="Cape Verde">Cape Verde</option>
                        <option value="Cayman Islands">Cayman Islands</option>
                        <option value="Central African Republic">Central African Republic</option>
                        <option value="Chad">Chad</option>
                        <option value="Chile">Chile</option>
                        <option value="China">China</option>
                        <option value="Christmas Island">Christmas Island</option>
                        <option value="Cocos (Keeling) Islands">Cocos (Keeling) Islands</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Comoros">Comoros</option>
                        <option value="Congo">Congo</option>
                        <option value="Congo, The Democratic Republic of The">Congo, The Democratic Republic of The</option>
                        <option value="Cook Islands">Cook Islands</option>
                        <option value="Costa Rica">Costa Rica</option>
                        <option value="Cote D'ivoire">Cote D'ivoire</option>
                        <option value="Croatia">Croatia</option>
                        <option value="Cuba">Cuba</option>
                        <option value="Cyprus">Cyprus</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Djibouti">Djibouti</option>
                        <option value="Dominica">Dominica</option>
                        <option value="Dominican Republic">Dominican Republic</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="Egypt">Egypt</option>
                        <option value="El Salvador">El Salvador</option>
                        <option value="Equatorial Guinea">Equatorial Guinea</option>
                        <option value="Eritrea">Eritrea</option>
                        <option value="Estonia">Estonia</option>
                        <option value="Ethiopia">Ethiopia</option>
                        <option value="Falkland Islands (Malvinas)">Falkland Islands (Malvinas)</option>
                        <option value="Faroe Islands">Faroe Islands</option>
                        <option value="Fiji">Fiji</option>
                        <option value="Finland">Finland</option>
                        <option value="France">France</option>
                        <option value="French Guiana">French Guiana</option>
                        <option value="French Polynesia">French Polynesia</option>
                        <option value="French Southern Territories">French Southern Territories</option>
                        <option value="Gabon">Gabon</option>
                        <option value="Gambia">Gambia</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Germany">Germany</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Gibraltar">Gibraltar</option>
                        <option value="Greece">Greece</option>
                        <option value="Greenland">Greenland</option>
                        <option value="Grenada">Grenada</option>
                        <option value="Guadeloupe">Guadeloupe</option>
                        <option value="Guam">Guam</option>
                        <option value="Guatemala">Guatemala</option>
                        <option value="Guernsey">Guernsey</option>
                        <option value="Guinea">Guinea</option>
                        <option value="Guinea-bissau">Guinea-bissau</option>
                        <option value="Guyana">Guyana</option>
                        <option value="Haiti">Haiti</option>
                        <option value="Heard Island and Mcdonald Islands">Heard Island and Mcdonald Islands</option>
                        <option value="Holy See (Vatican City State)">Holy See (Vatican City State)</option>
                        <option value="Honduras">Honduras</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Iceland">Iceland</option>
                        <option value="India">India</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="Iran, Islamic Republic of">Iran, Islamic Republic of</option>
                        <option value="Iraq">Iraq</option>
                        <option value="Ireland">Ireland</option>
                        <option value="Isle of Man">Isle of Man</option>
                        <option value="Israel">Israel</option>
                        <option value="Italy">Italy</option>
                        <option value="Jamaica">Jamaica</option>
                        <option value="Japan">Japan</option>
                        <option value="Jersey">Jersey</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Kazakhstan">Kazakhstan</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Kiribati">Kiribati</option>
                        <option value="Korea, Democratic People's Republic of">Korea, Democratic People's Republic of</option>
                        <option value="Korea, Republic of">Korea, Republic of</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Kyrgyzstan">Kyrgyzstan</option>
                        <option value="Lao People's Democratic Republic">Lao People's Democratic Republic</option>
                        <option value="Latvia">Latvia</option>
                        <option value="Lebanon">Lebanon</option>
                        <option value="Lesotho">Lesotho</option>
                        <option value="Liberia">Liberia</option>
                        <option value="Libyan Arab Jamahiriya">Libyan Arab Jamahiriya</option>
                        <option value="Liechtenstein">Liechtenstein</option>
                        <option value="Lithuania">Lithuania</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Macao">Macao</option>
                        <option value="Macedonia, The Former Yugoslav Republic of">Macedonia, The Former Yugoslav Republic of</option>
                        <option value="Madagascar">Madagascar</option>
                        <option value="Malawi">Malawi</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Maldives">Maldives</option>
                        <option value="Mali">Mali</option>
                        <option value="Malta">Malta</option>
                        <option value="Marshall Islands">Marshall Islands</option>
                        <option value="Martinique">Martinique</option>
                        <option value="Mauritania">Mauritania</option>
                        <option value="Mauritius">Mauritius</option>
                        <option value="Mayotte">Mayotte</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Micronesia, Federated States of">Micronesia, Federated States of</option>
                        <option value="Moldova, Republic of">Moldova, Republic of</option>
                        <option value="Monaco">Monaco</option>
                        <option value="Mongolia">Mongolia</option>
                        <option value="Montenegro">Montenegro</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Morocco">Morocco</option>
                        <option value="Mozambique">Mozambique</option>
                        <option value="Myanmar">Myanmar</option>
                        <option value="Namibia">Namibia</option>
                        <option value="Nauru">Nauru</option>
                        <option value="Nepal">Nepal</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Netherlands Antilles">Netherlands Antilles</option>
                        <option value="New Caledonia">New Caledonia</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Nicaragua">Nicaragua</option>
                        <option value="Niger">Niger</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Niue">Niue</option>
                        <option value="Norfolk Island">Norfolk Island</option>
                        <option value="Northern Mariana Islands">Northern Mariana Islands</option>
                        <option value="Norway">Norway</option>
                        <option value="Oman">Oman</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Palau">Palau</option>
                        <option value="Palestinian Territory, Occupied">Palestinian Territory, Occupied</option>
                        <option value="Panama">Panama</option>
                        <option value="Papua New Guinea">Papua New Guinea</option>
                        <option value="Paraguay">Paraguay</option>
                        <option value="Peru">Peru</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Pitcairn">Pitcairn</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Puerto Rico">Puerto Rico</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Reunion">Reunion</option>
                        <option value="Romania">Romania</option>
                        <option value="Russian Federation">Russian Federation</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Saint Helena">Saint Helena</option>
                        <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                        <option value="Saint Lucia">Saint Lucia</option>
                        <option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
                        <option value="Saint Vincent and The Grenadines">Saint Vincent and The Grenadines</option>
                        <option value="Samoa">Samoa</option>
                        <option value="San Marino">San Marino</option>
                        <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Senegal">Senegal</option>
                        <option value="Serbia">Serbia</option>
                        <option value="Seychelles">Seychelles</option>
                        <option value="Sierra Leone">Sierra Leone</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Slovakia">Slovakia</option>
                        <option value="Slovenia">Slovenia</option>
                        <option value="Solomon Islands">Solomon Islands</option>
                        <option value="Somalia">Somalia</option>
                        <option value="South Africa">South Africa</option>
                        <option value="South Georgia and The South Sandwich Islands">South Georgia and The South Sandwich Islands</option>
                        <option value="Spain">Spain</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Sudan">Sudan</option>
                        <option value="Suriname">Suriname</option>
                        <option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
                        <option value="Swaziland">Swaziland</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Syrian Arab Republic">Syrian Arab Republic</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Tajikistan">Tajikistan</option>
                        <option value="Tanzania, United Republic of">Tanzania, United Republic of</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Timor-leste">Timor-leste</option>
                        <option value="Togo">Togo</option>
                        <option value="Tokelau">Tokelau</option>
                        <option value="Tonga">Tonga</option>
                        <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                        <option value="Tunisia">Tunisia</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Turkmenistan">Turkmenistan</option>
                        <option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
                        <option value="Tuvalu">Tuvalu</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Uzbekistan">Uzbekistan</option>
                        <option value="Vanuatu">Vanuatu</option>
                        <option value="Venezuela">Venezuela</option>
                        <option value="Viet Nam">Viet Nam</option>
                        <option value="Virgin Islands, British">Virgin Islands, British</option>
                        <option value="Virgin Islands, U.S.">Virgin Islands, U.S.</option>
                        <option value="Wallis and Futuna">Wallis and Futuna</option>
                        <option value="Western Sahara">Western Sahara</option>
                        <option value="Yemen">Yemen</option>
                        <option value="Zambia">Zambia</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                    </select>
                </label>
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Email</h6>Your email address will be used for communication, notifications, and to identify you in the system, but it won’t be shared publicly without your consent.</div>} >
                    <label>
                        Email
                        <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                            placeholder={'johndoe@mail.com'}
                            value={email}
                            onClick={dirty}
                            onChange={e => setEmail(e.target.value)}
                            type={'email'} name='email' autoComplete={'on'} required={true} title={'required'}
                        />
                    </label>
                </Tooltip>
                <div className="auth-section-divider" />
                <label>
                    Password
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                        placeholder={'At least 8 characters'}
                        value={password}
                        pattern={passPattern}
                        onClick={dirty}
                        onChange={e => setPassword(e.target.value)}
                        type={'password'} required={true} title={'At least 8 characters'}
                    />
                </label>


                <label>
                    Confirm Password
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                        placeholder={'confirm password'}
                        value={passwordCheck}
                        pattern={passPattern}
                        onClick={dirty}
                        onChange={e => setPasswordCheck(e.target.value)}
                        type={'password'} required={true} title={'At least 8 characters'}
                    />
                </label>
            </div>

            <div className="auth-card__foot">
                <p className="auth-terms-text">
                    By creating an account you accept the <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="auth-terms-link">Terms of Use</a> and the <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="auth-terms-link">Privacy Notice</a>.
                </p>
                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'} onClick={()=>setDirty(true)}>
                    Create account
                </button>
            </div>
            </>}

            {action === 'login' &&
            <>
                {/* LOGIN */}
                <label>
                    Email
                    <input className={'w-100 input w-fit d-block mx-auto mt-3'}
                        placeholder={'e-mail'}
                        value={email}
                        onClick={dirty}
                        onChange={e => setEmail(e.target.value)} type={'email'}
                        required={true} title={'required'}
                    />
                </label>
                <div className="auth-card__field">
                    <div className="auth-card__label-row">
                        <label htmlFor="auth-login-password">Password</label>
                        <button className="auth-card__link" type="button" onClick={e => {setAction('retrieve-password')}}>Forgot?</button>
                    </div>
                    <input id="auth-login-password" className={'w-100 input w-fit d-block mx-auto  mt-2'}
                        placeholder={'password'}
                        value={password}
                        pattern={passPattern}
                        onClick={dirty}
                        onChange={e => setPassword(e.target.value)}
                        type={'password'}
                        required={true} title={'At least 8 characters'}
                />
                </div>
                <div className="login-buttons">
                    <button className={'btn btn-primary login-button'} type={'submit'} onClick={()=>setDirty(true)}>
                        Sign in
                    </button>
                    {(window.location.host.includes('localhost') || window.location.href.indexOf('http') !== 0) &&
                        <button className={'btn login-button login-button--secondary'} type='button' onClick={(e) => offline()}>Offline mode</button>
                    }
                </div>
            </>}

            {action === 'retrieve-password' &&
            <>
                {/* RETRIEVE PASSWORD */}
                <label>
                    Enter your email
                    <input className={'w-100 input w-fit d-block mx-auto mt-3'}
                        placeholder={'e-mail'}
                        value={email}
                        onClick={dirty}
                        onChange={e => setEmail(e.target.value)} type={'email'}
                        required={true} title={'required'}
                    />
                </label>

                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'} onClick={()=>setDirty(true)}>
                    Send reset link
                </button>
            </>}


            <div className="auth-card__alt">
                {action === 'login'
                    ? <>New to Jjodel? <button className="auth-card__link" type="button" onClick={e => {setAction('register')}}>Create an account</button></>
                    : <>Already have an account? <button className="auth-card__link" type="button" onClick={e => {setAction('login')}}>Sign in</button></>}
            </div>
        </form>
        </div>
    </main>

    <AuthFooter />

    {/* Browser Warning Modal */}
    <BrowserWarningModal
        isOpen={showBrowserWarning}
        browserName={browserName}
        onClose={handleCloseBrowserWarning}
    />
</section>);
}

export {AuthPage};
