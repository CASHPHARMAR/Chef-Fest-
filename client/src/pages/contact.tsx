import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    sendMessageMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section id="contact" className="pt-20 py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">Get In Touch</h1>
            <p className="text-lg text-muted-foreground">Have questions? We'd love to hear from you</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-card rounded-2xl p-8">
              <h3 className="font-display font-bold text-xl text-foreground mb-6">Contact Information</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-envelope text-primary"></i>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href="mailto:calvinselassie1@gmail.com" 
                      className="text-foreground font-medium hover:text-primary transition-colors"
                      data-testid="email-link"
                    >
                      calvinselassie1@gmail.com
                    </a>
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold text-foreground mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/itz_calvin7?igsh=NHZpOGZtaDUwNDJw" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  data-testid="instagram-link"
                >
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a 
                  href="https://x.com/itz_calvin7?t=skowuAFZGnucSdCV-ZKhnA&s=09" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  data-testid="x-link"
                >
                  <i className="fab fa-x-twitter text-xl"></i>
                </a>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8">
              <h3 className="font-display font-bold text-xl text-foreground mb-6">Send a Message</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Your message..." 
                            className="min-h-[120px] resize-none" 
                            {...field}
                            data-testid="input-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full btn-3d"
                    disabled={sendMessageMutation.isPending}
                    data-testid="button-send"
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
