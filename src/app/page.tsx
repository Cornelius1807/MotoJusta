"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  BarChart3,
  MessageSquare,
  Wrench,
  ChevronRight,
  Star,
  CheckCircle2,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";

const LottiePlayer = dynamic(() => import("@/components/lottie-player"), {
  ssr: false,
  loading: () => (
    <div className="w-72 h-72 bg-secondary/50 rounded-full animate-pulse" />
  ),
});

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } },
};

const features = [
  {
    icon: Shield,
    title: "Transparencia Total",
    description:
      "Cotizaciones desglosadas: mano de obra, repuestos, tiempo. Sin sorpresas.",
  },
  {
    icon: BarChart3,
    title: "Compara y Decide",
    description:
      "Recibe múltiples cotizaciones y compáralas lado a lado. Tú eliges.",
  },
  {
    icon: MessageSquare,
    title: "Control de Cambios",
    description:
      "Todo cambio adicional requiere tu aprobación explícita antes de proceder.",
  },
  {
    icon: Star,
    title: "Reputación Verificada",
    description:
      "Solo reseñas de servicios reales. Talleres verificados con evidencia.",
  },
];

const steps = [
  {
    num: "01",
    title: "Publica tu solicitud",
    desc: "Describe el problema, sube fotos y selecciona la urgencia.",
  },
  {
    num: "02",
    title: "Recibe cotizaciones",
    desc: "Talleres cercanos verificados te envían propuestas desglosadas.",
  },
  {
    num: "03",
    title: "Compara y acepta",
    desc: "Usa el comparador visual. Acepta la mejor oferta con 1 tap.",
  },
  {
    num: "04",
    title: "Servicio con control",
    desc: "Evidencias del proceso, aprobación de cambios y comprobante final.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Moto<span className="text-primary">Justa</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Ingresar
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col lg:flex-row items-center gap-12"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div className="flex-1 text-center lg:text-left" {...fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Plataforma de confianza para motociclistas
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Mantenimiento{" "}
              <span className="text-primary">transparente</span>
              <br />
              para tu moto
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Cotizaciones claras, control total de cambios adicionales y
              talleres verificados. Di adiós a las sorpresas de costo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-8">
                  Comenzar gratis
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                  ¿Cómo funciona?
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <LottiePlayer
              src="/animations/motorcycle-repair.json"
              className="w-72 h-72 sm:w-96 sm:h-96"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold">
              ¿Por qué <span className="text-primary">MotoJusta</span>?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Reducimos la asimetría informativa entre motociclistas y talleres
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
            {features.map((feat) => (
              <motion.div key={feat.title} className="bg-card rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow" variants={fadeInUp}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Cómo <span className="text-primary">funciona</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.num} className="relative" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
              <div className="text-6xl font-black text-primary/10 mb-2">{step.num}</div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { num: "100%", label: "Cotizaciones desglosadas" },
              { num: "0", label: "Cargos ocultos" },
              { num: "24h", label: "Tiempo de respuesta" },
              { num: "⭐ 4.8", label: "Satisfacción promedio" },
            ].map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                <div className="text-3xl sm:text-4xl font-bold">{stat.num}</div>
                <div className="text-sm mt-1 opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div className="max-w-3xl mx-auto text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Empieza a recibir cotizaciones justas hoy
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Regístrate gratis. Sin pagos obligatorios. Sin letra chica.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-10">
              Crear mi cuenta
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">MotoJusta</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MotoJusta. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
