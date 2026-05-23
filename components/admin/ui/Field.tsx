import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55">{children}</span>
  );
}

const fieldBase =
  "bg-transparent border border-white/15 px-3 py-2 outline-none focus:border-[#ff6a00] text-white/95 placeholder:text-white/30 transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={[fieldBase, className].filter(Boolean).join(" ")} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={[fieldBase, "min-h-[96px] resize-y", className].filter(Boolean).join(" ")} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={[
        "bg-[#0a0b0d] border border-white/15 px-3 py-2 outline-none focus:border-[#ff6a00] text-white/95 transition-colors",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </select>
  );
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
