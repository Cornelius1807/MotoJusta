"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { acceptTerms } from "@/app/actions/profile";
import { toast } from "sonner";

interface TermsDialogProps {
  termsAccepted: boolean;
}

export function TermsDialog({ termsAccepted }: TermsDialogProps) {
  const [open, setOpen] = useState(!termsAccepted);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptTerms();
      setOpen(false);
      toast.success("Términos aceptados");
    } catch (err: any) {
      toast.error("Error al aceptar términos", {
        description: err.message || "Intenta de nuevo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (termsAccepted) return null;

  return (
    <Dialog open={open} onOpenChange={() => {/* Cannot dismiss without accepting */}}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Términos y Condiciones de MotoJusta</DialogTitle>
          <DialogDescription>Lee y acepta los términos para continuar usando la plataforma.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="text-sm text-muted-foreground space-y-4">
            <p>
              Bienvenido a <strong>MotoJusta</strong>. Al usar esta plataforma aceptas
              los siguientes términos y condiciones:
            </p>
            <h4 className="font-semibold text-foreground">1. Objeto del servicio</h4>
            <p>
              MotoJusta es una plataforma que conecta a motociclistas con talleres
              verificados para solicitar cotizaciones de servicios mecánicos. No somos
              un taller ni realizamos reparaciones directamente.
            </p>
            <h4 className="font-semibold text-foreground">2. Registro y datos</h4>
            <p>
              Al registrarte, te comprometes a proporcionar información veraz. Tus datos
              personales serán tratados conforme a nuestra Política de Privacidad y la
              legislación peruana vigente (Ley N° 29733).
            </p>
            <h4 className="font-semibold text-foreground">3. Cotizaciones y pagos</h4>
            <p>
              Las cotizaciones son proporcionadas por los talleres. MotoJusta no
              garantiza precios ni calidad de los servicios, pero facilita herramientas
              de comparación y transparencia. Los pagos se realizan directamente entre
              el motociclista y el taller.
            </p>
            <h4 className="font-semibold text-foreground">4. Responsabilidades</h4>
            <p>
              Los talleres son responsables de la calidad y garantía de sus servicios.
              MotoJusta actúa como intermediario y proporciona herramientas de
              seguimiento, evidencia fotográfica y gestión de incidencias.
            </p>
            <h4 className="font-semibold text-foreground">5. Cambios en el servicio</h4>
            <p>
              Cualquier cambio adicional durante un servicio debe ser aprobado
              explícitamente por el motociclista antes de ejecutarse (sistema
              bloqueante).
            </p>
            <h4 className="font-semibold text-foreground">6. AI y diagnósticos</h4>
            <p>
              Las funciones de inteligencia artificial son informativas y no reemplazan
              el diagnóstico presencial de un técnico certificado.
            </p>
            <h4 className="font-semibold text-foreground">7. Modificaciones</h4>
            <p>
              MotoJusta se reserva el derecho de actualizar estos términos. Los cambios
              serán notificados oportunamente.
            </p>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleAccept} disabled={isLoading} className="w-full">
            {isLoading ? "Aceptando..." : "Acepto los términos y condiciones"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
