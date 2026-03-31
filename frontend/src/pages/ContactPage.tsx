import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Headphones, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../components/Toast';
import { AuthRuntimeStatus, fixedApiService } from '../services/fixedApi';
import { buildApiUrl } from '../utils/apiBase';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactResponseBody {
  success?: boolean;
  message?: string;
  warning?: string;
  detail?: string;
}

const contactInfo = [
  {
    icon: <Mail className="h-6 w-6" />,
    title: 'Email Us',
    detail: 'support@pymastery.com',
    sub: 'We reply within 24 hours',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: 'Call Us',
    detail: '+91 70608 13814',
    sub: 'Mon-Fri, 9am to 6pm IST',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: 'Our Office',
    detail: 'Garhmukteshwar, Hapur',
    sub: 'India - 245205',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  }
];

const features = [
  { icon: <Clock className="h-5 w-5 text-blue-500" />, text: '24-hour response time' },
  { icon: <MessageSquare className="h-5 w-5 text-green-500" />, text: 'Dedicated support team' },
  { icon: <Headphones className="h-5 w-5 text-purple-500" />, text: 'Expert technical help' }
];

const ContactPage: React.FC = () => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', subject: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<AuthRuntimeStatus | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submissionWarning, setSubmissionWarning] = useState('');
  const emailServiceUnavailable = runtimeStatus?.email_service?.configured === false;

  useEffect(() => {
    let mounted = true;

    const loadRuntimeStatus = async () => {
      try {
        const status = await fixedApiService.auth.getRuntimeStatus();
        if (mounted) {
          setRuntimeStatus(status);
        }
      } catch {
        if (mounted) {
          setRuntimeStatus(null);
        }
      }
    };

    void loadRuntimeStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((previousValue) => ({ ...previousValue, [event.target.name]: event.target.value }));
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (emailServiceUnavailable) {
      const message = 'Email service not configured (demo mode). Contact messages are unavailable in this environment.';
      setSubmitError(message);
      addToast({ type: 'warning', title: 'Contact Unavailable', message });
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      addToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in all required fields.' });
      return;
    }

    setIsLoading(true);
    setSubmitError('');
    setSubmissionWarning('');

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim()
      };
      const response = await fetch(buildApiUrl('/api/v1/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({})) as ContactResponseBody;

      if (response.ok) {
        setSubmissionWarning(body.warning || '');
        setIsSubmitted(true);
        addToast({
          type: 'success',
          title: 'Message Sent!',
          message: body.message || 'We will get back to you soon.'
        });

        if (body.warning) {
          addToast({
            type: 'warning',
            title: 'Confirmation Email Unavailable',
            message: body.warning
          });
        }
      } else {
        throw new Error(body.detail || body.message || 'We could not send your message right now. Please try again later.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'We could not send your message right now. Please try again later.';
      setSubmitError(message);
      addToast({
        type: 'error',
        title: 'Send Failed',
        message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-yellow-300" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-blue-300" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">Get in Touch</h1>
          <p className="mx-auto max-w-2xl text-xl text-blue-100">
            Have a question or need help? Our team is here for you. Reach out and we&apos;ll respond within 24 hours.
          </p>
          <div className="mt-6 flex justify-center gap-6 text-sm text-blue-200">
            {features.map((feature) => (
              <span key={feature.text} className="flex items-center gap-1.5">
                {feature.icon} {feature.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-6 transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className={`rounded-lg p-3 ${info.color}`}>{info.icon}</div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{info.title}</p>
                  <p className="text-gray-700 dark:text-slate-300">{info.detail}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{info.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {isSubmitted ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-xl dark:bg-slate-800">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">Message Sent!</h2>
              <p className="mb-6 text-gray-600 dark:text-slate-400">
                Thank you for reaching out. Our team will get back to you within 24 hours.
              </p>
              {submissionWarning && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                  {submissionWarning}
                </div>
              )}
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                  setSubmitError('');
                  setSubmissionWarning('');
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800 sm:p-10">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Send Us a Message</h2>
                <p className="mt-2 text-gray-600 dark:text-slate-400">Fill in the form and we&apos;ll get back to you promptly.</p>
              </div>

              {emailServiceUnavailable && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                  Email service not configured (demo mode). Contact messages are unavailable in this environment.
                </div>
              )}

              {submitError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      disabled={isLoading || emailServiceUnavailable}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      disabled={isLoading || emailServiceUnavailable}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Subject</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isLoading || emailServiceUnavailable}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Payments">Billing & Payments</option>
                    <option value="Course Content">Course Content</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    disabled={isLoading || emailServiceUnavailable}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading || emailServiceUnavailable}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : emailServiceUnavailable ? 'Unavailable in Demo' : 'Send Message'}
                  {!isLoading && <Send className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
