import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Calendar, MessageCircle, ArrowRight, Star, MapPin, Phone, Navigation, PhoneCall, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';

const PHONE_NUMBERS = ['+260979287496', '+260978097202'];

const services = [
  { icon: '👗', title: 'Chitenge Wear', desc: 'Beautiful African prints for men & women' },
  { icon: '💒', title: 'Wedding Garments', desc: 'Bridal gowns, suits & bridesmaids' },
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
          <img src={heroBg} alt="Salem Tailors workshop" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />
        </div>
        <div className="relative container px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold text-gold" />
              ))}
              <span className="text-sm text-gold-light ml-1 font-medium">Trusted in Lusaka</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">
              Crafting Your Perfect Style
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-6 leading-relaxed">
              Premium African fashion, wedding garments & custom designs. 
              From chitenge to couture — tailored just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/book">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-warm gap-2">
                  Book an Appointment <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="https://wa.me/260979287496" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-warm gap-2 border-0">
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Our Services</h2>
            <p className="text-muted-foreground">Quality craftsmanship for every occasion</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-lg p-4 border border-border hover:shadow-warm transition-shadow"
              >
                <span className="text-2xl mb-2 block">{s.icon}</span>
                <h3 className="font-serif font-semibold text-foreground text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-card">
        <div className="container">
          <h2 className="font-serif text-3xl font-bold text-center text-foreground mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { step: '1', icon: <MessageCircle className="h-6 w-6" />, title: 'Submit Request', desc: 'Tell us what you need with reference images' },
              { step: '2', icon: <Calendar className="h-6 w-6" />, title: 'Book Appointment', desc: 'Schedule consultation & measurements' },
              { step: '3', icon: <Scissors className="h-6 w-6" />, title: 'Track Progress', desc: 'Follow your garment from fabric to finish' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="font-serif font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
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
