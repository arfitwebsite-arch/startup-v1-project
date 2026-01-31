import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "Support",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Submitted:", form);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setForm({
        name: "",
        email: "",
        type: "Support",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Hero */}
      <section className="px-6 pt-28 pb-16 text-center max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Let’s Connect
        </h1>
        <p className="mt-6 text-gray-400 text-lg max-w-2xl mx-auto">
          Whether you have questions, ideas, or want to build something meaningful with us —
          we’re listening.
        </p>
      </section>

      {/* Main Section */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">

          {/* Contact Form */}
          <div className="bg-[#161616] border border-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-700 text-green-400">
                Your message has been sent successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none"
              />

              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none"
              />

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none"
              >
                <option>Support</option>
                <option>Partnership</option>
                <option>Join the Team</option>
              </select>

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                required
                value={form.subject}
                onChange={handleChange}
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none"
              />

              <textarea
                name="message"
                placeholder="Your Message"
                rows={5}
                required
                value={form.message}
                onChange={handleChange}
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:opacity-90 transition rounded-lg py-3 font-semibold"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

            </form>
          </div>

          {/* Collaboration Section */}
          <div className="space-y-8">

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Work With Us
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Explain My Decision is building a new category: Decision Intelligence.
                We believe reasoning quality matters more than raw answers.
              </p>
            </div>

            <div className="bg-[#161616] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Who We're Looking For</h3>
              <ul className="text-gray-400 space-y-2">
                <li>• AI / ML engineers interested in reasoning systems</li>
                <li>• Frontend developers (Next.js / UI-focused)</li>
                <li>• Growth & marketing partners</li>
                <li>• Product thinkers who care about clarity and logic</li>
              </ul>
            </div>

            <div className="bg-[#161616] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Early Stage Opportunity</h3>
              <p className="text-gray-400">
                We are in early-stage development (V2 roadmap). 
                If you're ambitious and want to build something impactful from the ground up,
                select <strong>“Join the Team”</strong> in the form and tell us what you bring.
              </p>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
