import type { ElementType, ReactNode } from "react";
import { fieldKind } from "@/lib/content-model";

/**
 * Text Jeremy can change from the page. To a visitor it is an ordinary element; the
 * data attributes are what the editor looks for once he is signed in. `path` names the
 * field in SiteContent, e.g. "reeds.items.0.blurb".
 */
export function Editable({
  path,
  as: Tag = "span",
  className,
  children,
}: {
  path: string;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-edit={path} data-edit-kind={fieldKind(path)} className={className}>
      {children}
    </Tag>
  );
}
