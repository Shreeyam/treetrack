import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Logo from '@/components/brand/logo';
import { Link } from 'react-router';

const AuthForm = ({ onLogin, isRegister, setIsRegister }) => {
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    const handleLogin = async () => {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername, password: loginPassword })
            });
            const data = await res.json();
            if (data.username) {
                onLogin(data);
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRegister = async () => {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: registerUsername, 
                    password: registerPassword,
                    firstName: firstName,
                    lastName: lastName,
                    email: email
                })
            });
            const data = await res.json();
            if (data.username) {
                onLogin(data);
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleForgotPassword = () => {
        alert('Forgot Password functionality not yet implemented.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Logo />
                    <h2 className="text-xl font-semibold">{isRegister ? 'Register' : 'Login'}</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isRegister ? (
                        <>
                            <Input
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <Input
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                            <Input
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                placeholder="Username"
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                            />
                            <Button onClick={handleRegister} className="w-full">Register</Button>
                            <div className="flex flex-col space-y-2 text-sm">
                                <div className="text-center">
                                    Already have an account?{' '}
                                    <Link to="/login">
                                        <Button variant="link" className="p-0 h-auto" onClick={() => setIsRegister(false)}>
                                            Login here
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Input
                                placeholder="Username"
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                            />
                            <Button onClick={handleLogin} className="w-full">Login</Button>
                            <div className="flex flex-col space-y-2 text-sm">
                                <div className="flex justify-end">
                                    <Button variant="link" className="p-0 h-auto" onClick={handleForgotPassword}>
                                        Forgot Password?
                                    </Button>
                                </div>
                                <div className="text-center">
                                    Don&apos;t have an account?{' '}
                                    <Link to="/register">
                                        <Button variant="link" className="p-0 h-auto" onClick={() => setIsRegister(true)}>
                                            Register here
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthForm;