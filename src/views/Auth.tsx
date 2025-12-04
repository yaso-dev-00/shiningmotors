import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRedirectFromUrlOrStorage, clearRedirectPath } from "@/lib/utils/routeRemember";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const handleSignIn = async (data: LoginInput) => {
    setIsLoading(true);
    const result = await signIn(data.email, data.password);
    setIsLoading(false);
    
    // Redirect will be handled by useEffect when isAuthenticated changes
    if (result?.error) {
      // Error is already handled by AuthContext toast
      return;
    }
  };

  const handleSignUp = async (data: RegisterInput) => {
    setIsLoading(true);
    const result = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);
    
    // Redirect will be handled by useEffect when isAuthenticated changes
    if (result?.error) {
      // Error is already handled by AuthContext toast
      return;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    // Store redirect path before OAuth redirect
    const redirectPath = getRedirectFromUrlOrStorage(searchParams);
    if (redirectPath) {
      // Store in sessionStorage for OAuth callback
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_redirect_path', redirectPath);
      }
    }
    await signInWithGoogle();
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = getRedirectFromUrlOrStorage(searchParams);
      clearRedirectPath();
      router.replace((redirectPath || "/") as Route);
    }
  }, [isAuthenticated, router, searchParams]);
  
  if (isAuthenticated) {
    return null;
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                Welcome to Shining Motors
              </CardTitle>
              <CardDescription>
                Sign in or create an account to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(handleSignIn)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter your email"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <FormControl>
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={togglePasswordVisibility}
                              >
                                {!showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-sm-red hover:bg-sm-red-light"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300"></span>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {isGoogleLoading ? "Connecting..." : "Sign in with Google"}
                  </Button>
                </TabsContent>

                <TabsContent value="signup">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(handleSignUp)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <FormControl>
                                <Input
                                  placeholder="Enter your full name"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter your email"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <FormControl>
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  className="pl-10"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={togglePasswordVisibility}
                              >
                                {!showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-sm-red hover:bg-sm-red-light"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300"></span>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {isGoogleLoading ? "Connecting..." : "Sign up with Google"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6 pt-0">
              <div className="text-sm text-center text-gray-500">
                By continuing, you agree to our{" "}
                <NextLink href={"/terms" as any} className="text-sm-red hover:underline">
                  Terms of Service
                </NextLink>{" "}
                and{" "}
                <NextLink href={"/privacy" as any} className="text-sm-red hover:underline">
                  Privacy Policy
                </NextLink>
                .
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
