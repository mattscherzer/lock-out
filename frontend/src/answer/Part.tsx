import type { ReactNode } from "react";

export function Part({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 [&_svg]:size-5 [&_svg]:flex-none">
      <h3 className="m-0 flex items-center gap-2 title-sm">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
