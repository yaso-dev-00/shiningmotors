import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LogOut } from "lucide-react";
import { emailSchema, type EmailInput } from "@/lib/validations/settings";

const ChangeEmailForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Check if user is logged in with OAuth provider
  const isOAuthUser =
    user?.app_metadata?.provider && user.app_metadata.provider !== "email";
  const providerName = isOAuthUser ? user?.app_metadata?.provider : null;

  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: EmailInput) => {
    // Don't proceed if current email is the same as the new email
    if (data.email === user?.email) {
      toast({
        title: "No change detected",
        description: "The email address is the same as your current one.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ email: data.email });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your new email to confirm the change.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating email",
        description: error.message || "Failed to update email address.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="max-[769px]:text-xl">Email Address</CardTitle>
        <CardDescription>
          {isOAuthUser
            ? `You're signed in with ${
                (providerName?.charAt(0) || '').toUpperCase() + (providerName?.slice(1) || '')
              }`
            : "Update your email address"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isOAuthUser ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                You're currently logged in via{" "}
                {(providerName?.charAt(0) || '').toUpperCase() + (providerName?.slice(1) || '')}{" "}
                with the email:
                <span className="ml-1 font-medium text-foreground">
                  {user?.email}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Email management is handled by your {providerName || 'OAuth'} account.
              </p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-sm-red hover:bg-sm-red-light"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update email"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      {isOAuthUser && (
        <CardFooter>
          <Button
            variant="outline"
            className="flex w-full items-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut size={16} /> Sign out
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ChangeEmailForm;
