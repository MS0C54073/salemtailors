import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Calendar, MessageCircle, ArrowRight, Star, MapPin, Phone, Navigation, PhoneCall, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import TailorScene from '@/components/TailorScene';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';

const PHONE_NUMBERS = ['+260979287496', '+260978097202'];

const services = [
  { icon: '👗', title: 'Chitenge Wear', desc: 'Beautiful African prints for men & women' },
  { icon: '🎒', title: 'Bags', desc: 'Backpacks, laptop bags, clutch purses, school bags & more' },
  { icon: '👔', title: 'Formal & Casual', desc: 'Professional and everyday wear' },
  { icon: '✂️', title: 'Alterations', desc: 'Perfect fit adjustments' },
  { icon: '🎨', title: 'Custom Designs', desc: 'Bring your vision to life' },
  { icon: '📐', title: 'Measurements', desc: 'Professional body measurements' },
];

const Index = () => {
  const { user, role } = useAuth();
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [featured, setFeatured] = useState<any[]>([]);
  const dashboardLink = user ? (role === 'client' ? '/dashboard/client' : '/dashboard/admin') : null;

  useEffect(() => {
    supabase
      .from('portfolio_items')
      .select('*')
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .limit(8)
      .then(({ data }) => setFeatured(data || []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-bold text-foreground">Salem Tailors</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link to="/catalogue" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Shop</Button>
            </Link>
            {user ? (
              <Link to={dashboardLink || '/dashboard/client'}>
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
            ) : null}
            <Link to="/book">
              <Button size="sm">Book Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 pt-14">
          <img
            src={heroBg}
            alt="Salem Tailors workshop"
            className="w-full h-full object-cover animate-kenburns"
          />
          {/* Layered cinematic gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/55 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,hsl(var(--gold)/0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-grain opacity-40 mix-blend-overlay pointer-events-none" />
        </div>

        <div className="relative container px-4 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="h-px w-10 bg-gold/70" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold-light font-medium">
                Atelier · Lusaka · Est. Salem Tailors
              </span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl font-semibold leading-[1.02] mb-5 text-primary-foreground">
              Crafting your
              <span className="block italic font-normal text-gradient-warm animate-shimmer bg-[linear-gradient(90deg,hsl(var(--gold-light)),hsl(var(--gold)),hsl(var(--terracotta)),hsl(var(--gold)),hsl(var(--gold-light)))]">
                perfect silhouette
              </span>
            </h1>

            <p className="text-primary-foreground/85 text-base md:text-lg mb-3 leading-relaxed max-w-xl font-light">
              Hand-finished African couture, bespoke bags and signature chitenge
              — measured, cut and sewn with the quiet patience of a craft.
            </p>

            <div className="flex items-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
              ))}
              <span className="text-xs text-primary-foreground/70 ml-2 tracking-wide">
                Trusted across Lusaka since day one
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/book">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-elegant gap-2 px-8 h-12">
                  Book an Appointment <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="https://wa.me/260979287496" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-warm gap-2 border-0 h-12">
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>

            {/* Quick WhatsApp service chips */}
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary-foreground/60 mb-2">
                Quick enquiry on WhatsApp
              </p>
              <div className="flex flex-wrap gap-2">
                {services.slice(0, 4).map((s) => (
                  <a
                    key={s.title}
                    href={`https://wa.me/260979287496?text=${encodeURIComponent(
                      `Hello Salem Tailors, I'm interested in your ${s.title} service. Could you tell me more?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-foreground/10 hover:bg-[#25D366] hover:text-white text-primary-foreground border border-primary-foreground/20 hover:border-[#25D366] backdrop-blur-sm transition-all"
                  >
                    <MessageCircle className="h-3 w-3" />
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Soft fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      </section>

      {/* Editorial pull-quote */}
      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-3xl text-center">
          <div className="ornament mb-6 mx-auto max-w-xs">
            <Scissors className="h-4 w-4 text-gold shrink-0" />
          </div>
          <p className="font-serif italic text-2xl md:text-3xl leading-snug text-foreground">
            “A garment, well made, is a quiet conversation between fabric, body
            and the hands that bring them together.”
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            — The Salem Atelier
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-medium">
              The House of Salem
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mt-2 mb-3">
              Our <em className="font-normal text-gradient-gold">Services</em>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Six disciplines, one quiet pursuit — clothes made to be lived in.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="group relative bg-card rounded-xl p-5 border border-border hover:border-primary/40 hover:shadow-elegant transition-all overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br from-gold/10 to-terracotta/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <span className="text-3xl mb-3 block transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 origin-bottom-left">
                    {s.icon}
                  </span>
                  <h3 className="font-serif font-semibold text-foreground text-base mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  <a
                    href={`https://wa.me/260979287496?text=${encodeURIComponent(
                      `Hello Salem Tailors, I'm interested in your ${s.title} service. Could you tell me more?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#25D366] hover:text-[#1ebe57] transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Enquire on WhatsApp
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/catalogue">
              <Button size="lg" variant="outline" className="gap-2 border-primary/40 hover:bg-primary hover:text-primary-foreground transition-colors">
                Browse the Shop <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Animated workshop scene */}
      <section className="py-12 px-4 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">A Day at Salem Tailors</h2>
            <p className="text-muted-foreground">From the workshop to your wardrobe</p>
          </motion.div>
          <TailorScene />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none" />
        <div className="container relative">
          <div className="text-center mb-12">
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-medium">The Journey</span>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mt-2">
              How It <em className="font-normal text-gradient-gold">Works</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            {[
              { step: '01', icon: <MessageCircle className="h-5 w-5" />, title: 'Submit Request', desc: 'Tell us what you need with reference images' },
              { step: '02', icon: <Calendar className="h-5 w-5" />, title: 'Book Appointment', desc: 'Schedule consultation & measurements' },
              { step: '03', icon: <Scissors className="h-5 w-5" />, title: 'Track Progress', desc: 'Follow your garment from fabric to finish' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 rounded-full bg-background border border-gold/40 text-primary mx-auto mb-4 flex items-center justify-center shadow-warm relative z-10">
                  {item.icon}
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-1">
                  Step {item.step}
                </span>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[14rem] mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Portfolio */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-card">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Our Work</h2>
              <p className="text-muted-foreground">A glimpse of garments we've crafted</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featured.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-lg overflow-hidden border border-border shadow-sm group relative"
                >
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-2">
                    <p className="text-xs font-semibold text-primary-foreground truncate">{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location / Map */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Visit Our Shop</h2>
            <p className="text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              Katungu Market, Lusaka, Zambia
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden border border-border shadow-warm bg-card"
          >
            <div className="aspect-video w-full">
              <iframe
                title="Salem Tailors location — Katungu Market, Lusaka"
                src="https://www.google.com/maps?q=Katungu+Market,+Lusaka,+Zambia&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4">
              <div>
                <p className="font-serif font-semibold text-foreground">Salem Tailors</p>
                <p className="text-sm text-muted-foreground">Katungu Market, Lusaka, Zambia</p>
              </div>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Katungu+Market,+Lusaka,+Zambia"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full sm:w-auto gap-2">
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-foreground text-primary-foreground">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="h-5 w-5 text-gold" />
                <span className="font-serif text-xl font-bold">Salem Tailors</span>
              </div>
              <p className="text-primary-foreground/60 text-sm max-w-xs">
                Premium tailoring services in Lusaka, Zambia. Crafting beautiful garments since day one.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <span>Katungu Market, Lusaka, Zambia</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gold shrink-0 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="text-primary-foreground/60 text-xs uppercase tracking-wide">
                    Call or WhatsApp
                  </span>
                  {PHONE_NUMBERS.map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setContactPhone(num)}
                      className="text-left font-medium text-primary-foreground hover:text-gold transition-colors underline-offset-4 hover:underline"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-6 pt-4 flex items-center justify-between text-xs text-primary-foreground/40">
            <span>© 2026 Salem Tailors. All rights reserved.</span>
            <Link
              to="/admin"
              title="Admin"
              aria-label="Admin login"
              className="p-1.5 rounded-md hover:bg-primary-foreground/10 hover:text-gold transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </footer>

      {/* Contact method dialog */}
      <Dialog open={!!contactPhone} onOpenChange={(open) => !open && setContactPhone(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Contact Salem Tailors</DialogTitle>
            <DialogDescription>
              How would you like to reach us on{' '}
              <span className="font-semibold text-foreground">{contactPhone}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
            <a
              href={`https://wa.me/${contactPhone?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setContactPhone(null)}
              className="w-full"
            >
              <Button className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white gap-2 border-0">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
            <a
              href={`tel:${contactPhone}`}
              onClick={() => setContactPhone(null)}
              className="w-full"
            >
              <Button variant="outline" className="w-full gap-2">
                <PhoneCall className="h-4 w-4" />
                Call directly
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
