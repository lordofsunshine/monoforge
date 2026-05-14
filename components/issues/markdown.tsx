import { MarkdownRenderer } from "@/components/repository/markdown-renderer";

type MarkdownProps = {
  content: string | null | undefined;
};

export function Markdown({ content }: MarkdownProps) {
  return <MarkdownRenderer content={content} empty="" />;
}
