import {FormEvent, JSX} from 'react';
import {useStateIfMounted} from 'use-state-if-mounted';
import type { Dictionary} from '../joiner';
import { DUser, R, SetRootFieldAction, U} from '../joiner';
import Storage from '../data/storage';
import {AuthApi, UsersApi} from "../api/persistance";
import logo from '../static/img/jjodel-124.png';
import {Tooltip} from '../components/forEndUser/Tooltip';
import { RegisterRequest } from '../api/DTO/RegisterRequest';
import { LoginRequest } from '../api/DTO/LoginRequest';
import { TokenResponse } from '../api/DTO/TokenResponse';
import {ResetPasswordRequest} from "../api/DTO/ResetPasswordRequest";
import "./auth.scss"

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
    const [newsletter, setNewsletter] = useStateIfMounted(false);
    const [isDirty, setDirty] = useStateIfMounted(false);
    const [dirtyStatuses, setDirtyStatuses] = useStateIfMounted<Dictionary<string, boolean>>({});
    const dirty = (e: React.MouseEvent<HTMLInputElement | HTMLSelectElement>)=>{
        /* for real-time validation while you write the form, disabled for now
        let name = (e.target as HTMLElement)?.getAttribute?.('name')||'';
        setDirtyStatuses({...dirtyStatuses, [name]: true});
         */
    }

    const onSubmit = async(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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



    const reset_password = async (): Promise<boolean> => {

        try {
            const resetPasswordRequest = new ResetPasswordRequest();
            resetPasswordRequest.email = email;
            const response = await AuthApi.reset_password(resetPasswordRequest);

            let category = +(response.code+'')[0];
            switch (category) {
                case 2: U.alert('i', <>Request completed, check your email for a reset link (might be in spam).</>, ''); break;
                case 4: U.alert('e', 'Incorrect request, is your email correct?', ''); return false;
                case 5: U.alert('e', 'Request failed for a server error. Retry later while we are fixing our issue.', ''); return false;
                default:
                    U.alert('e', 'Request failed.', '');
                    return false;
            }

        } catch (e) {
            console.error("Errore nella richiesta:", e);
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

            const response = await AuthApi.login(loginRequest);
            const raw: TokenResponse | null = response.data;

            console.log('login debug', {loginRequest, response, raw});
            let category = +(response.code+'')[0];

            switch (category) {
                case 2: U.alert('i', <>Login successful you are being redirected to your <a href={'//#/allProjects'}>dashboard</a>.</>, ''); break;
                case 4: U.alert('e', 'Username or password incorrect.', ''); return false;
                case 5: U.alert('e', 'Login failed due to a server error. Retry later while we are fixing our issue.', ''); return false; // or try offline mode
                default:
                    U.alert('e', 'Login failed.', '');
                    return false;
            }
            if (!raw?.token || typeof raw.token !== 'string') { U.alert('e', 'Login failed or invalid token.', ''); return false; }

            const claims = AuthApi.readJwtToken(raw.token);
            console.log('login claims', {response, raw, claims});
            if (!claims) { U.alert('e', 'Invalid token.', ''); return false; }
            AuthApi.storeSessionData(raw.token, claims.exp || 0, undefined);

            // const user: DUser = DUser.new(claims.name, '', claims.nickname, '',  '', false, claims.email,  raw.token, claims._Id, claims.id, true);
            const user: DUser|null = await UsersApi.getUserByGUID(claims.id, raw, claims);
            // name-surname error is on server-side get or set. not on client side.
            /*if ((window as any).debug1 && user && user.surname === user.name) {
                console.log('error name debug', {user});
                return;
            }*/
            if (!user) {
                U.alert('e', 'Login failed or invalid token.', '');
                // todo: report error
                return false;
            }
            Storage.write('user', user);
            //U.resetState();
            R.navigate('/allProjects');
        } catch (e) {
            console.error("Login error:");
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
        registerRequest.NewsletterEnabled = newsletter;
        registerRequest.Nickname = nickname;
        registerRequest.Email = email;
        registerRequest.Password = password;
        console.log(registerRequest);
        const response = await AuthApi.register(registerRequest);
        let category = +(response.code+'')[0];
        switch (category) {
            case 2: U.alert('i', <>Request completed, check your email for an activation link (might be in spam).</>, ''); break;
            case 4: U.alert('e', 'Incorrect request, are you missing fields?', ''); return false;
            case 5: U.alert('e', 'Registration failed due to a server error. Retry later while we are fixing our issue.', ''); return false;
            default:
                U.alert('e', 'Registration failed.', '');
                return false;
        }

        const data = U.wrapper<DUser>(response.data);
        Storage.write('token', data.token);
        const user = DUser.new(data.name, data.surname, data.nickname, data.affiliation, data.country, data.newsletter || false, data.email, data.token, data.id, data._Id);
        Storage.write('user', user);
        Storage.write('offline', false);
        R.navigate('/allProjects');
        U.resetState();
        return true;
    }

    const offline = () => {
        AuthApi.offline();
        R.navigate('/allProjects');
        // U.resetState();
    }

    return(<section className={`w-100 h-100 login bg ${action === 'register' ? 'register' : action === 'retrieve-password' ? 'retrieve' : ''} `+(isDirty?' dirty':'')}>

        <form className={'d-block bg-white rounded border mx-auto w-fit px-5 py-4 mt-5'} onSubmit={onSubmit}>
            <label className={'fs-1 d-block text-center text-primary login-header'}>

                {action === 'register' && 'Create an Account'}
                {action === 'login' && 'Sign In'}
                {action === 'retrieve-password' && 'Retrieve your Password'}


            </label>

            {action === 'register' && <>

                {/* REGISTRATION */}

                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>First Name</h6>Your first name will be visible to others whenever you interact with them, such as during collaboration on shared projects.</div>} >
                    <label>
                        First Name
                        <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                            placeholder={'john'}
                            value={name}
                            onClick={dirty}
                            onChange={e => setName(e.target.value)}
                            type={'text'} required={true}
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
                               type={'text'} required={true}
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
                                   type={'text'} required={true}
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
                            type={'email'} name='email' autoComplete={'on'} required={true}
                        />
                    </label>
                </Tooltip>
                <br /><br /><br />
                <label>
                    Password
                    <input className={'w-100 input w-fit d-block mx-auto mt-2'}
                        placeholder={'password'}
                        value={password}
                        pattern={passPattern}
                        onClick={dirty}
                        onChange={e => setPassword(e.target.value)}
                        type={'password'} required={true}
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
                        type={'password'} required={true}
                    />
                </label>

                <br /><br /><br />
                <Tooltip tooltip={<div style={{padding: '10px', maxWidth: '600px'}}><h6>Newsletter</h6>Select this option for remaining updated about Jjodel new releases, updates, and initiatives.</div>} >
                    <label>
                        <input className={'checkbox'}
                            placeholder={'newsletter'}
                            checked={newsletter}
                            onClick={dirty}
                            onChange={e => setNewsletter(e.target.checked)}
                            type={'checkbox'}
                            style={{outline: 'none', marginTop: '10px', float: 'left'}}
                        />
                        <div style={{display: 'block', width: '90%', float: 'left', marginBottom: '10px', paddingLeft: '10px'}}>Newsletter. Subscribe to the newsletter to receive updates and news. You can manage your registration preferences at any time. </div>
                    </label>

                </Tooltip>
                <br />
                <div style={{width: '100%', textAlign: 'center'}}>
                    By proceeding you accept the terms and conditions.
                </div>
                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'} onClick={()=>setDirty(true)}>
                    Create
                </button>
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
                        required={true}
                    />
                </label>
                <label>
                    Password
                    <input className={'w-100 input w-fit d-block mx-auto  mt-2'}
                        placeholder={'password'}
                        value={password}
                        pattern={passPattern}
                        onClick={dirty}
                        onChange={e => setPassword(e.target.value)}
                        type={'password'}
                        required={true}
                />
                </label>
                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'} onClick={()=>setDirty(true)}>
                    Login
                </button>
                {(window.location.host.includes('localhost')) &&
                    <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type='button' onClick={(e) => offline()}>Offline mode</button>
                }
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
                        required={true}
                    />
                </label>

                <button className={'d-block btn btn-primary p-1 mx-auto mt-3 login-button'} type={'submit'} onClick={()=>setDirty(true)}>
                    Retrieve
                </button>
            </>}


            <label className={'mt-3 d-block text-center'}>
                {action === 'register' && <>Already have an account? <span tabIndex={-1} onClick={e => {setAction('login')}} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}>Sign In</span></>}
                {action === 'login' &&
                    <>
                        Don't have an account? <span tabIndex={-1} onClick={e => {setAction('register')}} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}>Register</span><br/>
                        <span tabIndex={-1} onClick={e => {setAction('retrieve-password')}} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}>Forgot your password?</span>
                        <div className="alert alert-primary" role="alert" style={{marginTop: '12px'}}>
                            <b>Action required</b><br/> Please reset your password to continue using Jjodel 2.0.
                        </div>
                    </>
                }
                {action === 'retrieve-password' &&
                    <>
                        Go back to the <span tabIndex={-1} onClick={e => {setAction('login')}} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}>Sign In</span> page<br/>
                        Don't have an account? <span tabIndex={-1} onClick={e => {setAction('register')}} className={'ms-1 text-primary text-decoration-none cursor-pointer login-link'}>Register</span><br/>
                    </>
                }

            </label>
            <div className='login-logo'><img src={logo}></img></div>
        </form>
    </section>);
}

export {AuthPage};
