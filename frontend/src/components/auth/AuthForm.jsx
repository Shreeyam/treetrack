import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const AuthForm = ({ onLogin }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

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
                body: JSON.stringify({ username: registerUsername, password: registerPassword })
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <h2 className="text-xl font-semibold">{isRegister ? 'Register' : 'Login'}</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isRegister ? (
                        <>
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
                            <Button onClick={handleRegister}>Register</Button>
                            <div className="text-sm">
                                Already have an account?{' '}
                                <Button variant="link" onClick={() => setIsRegister(false)}>
                                    Login here
                                </Button>
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
                            <Button onClick={handleLogin}>Login</Button>
                            <div className="text-sm">
                                Don&apos;t have an account?{' '}
                                <Button variant="link" onClick={() => setIsRegister(true)}>
                                    Register here
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthForm;