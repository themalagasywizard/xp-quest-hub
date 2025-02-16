
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

// Common timezone list
const TIMEZONES = [
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Asia/Kolkata",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Rome",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC"
];

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  timezone: z.string(),
});

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, timezone, profile_picture')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      form.reset({
        username: data.username,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setProfilePicture(data.profile_picture);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          timezone: values.timezone,
        })
        .eq('id', session.user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function uploadProfilePicture(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfilePicture(publicUrl);
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <Sidebar />
      <main className="flex-1 ml-16 md:ml-64">
        <div className="container py-8 max-w-2xl">
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profilePicture || undefined} />
                  <AvatarFallback className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-4xl">
                    {form.getValues("username")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="profile-picture" 
                  className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    id="profile-picture"
                    className="hidden"
                    accept="image/*"
                    onChange={uploadProfilePicture}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Save Changes
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
