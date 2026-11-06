import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function IssueMarkdown({ content = "" }) {
  if (!content.trim()) return null;

  return (
    <div className="issue-markdown min-w-0 text-left text-sm leading-6 text-slate-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
            />
          ),
          h1: ({ ...props }) => (
            <h1 {...props} className="mb-3 mt-4 text-xl font-semibold text-white" />
          ),
          h2: ({ ...props }) => (
            <h2 {...props} className="mb-2 mt-4 text-lg font-semibold text-white" />
          ),
          h3: ({ ...props }) => (
            <h3 {...props} className="mb-2 mt-3 text-base font-semibold text-white" />
          ),
          p: ({ ...props }) => (
            <p {...props} className="my-2 break-words" />
          ),
          ul: ({ ...props }) => (
            <ul {...props} className="my-2 list-disc space-y-1 pl-6" />
          ),
          ol: ({ ...props }) => (
            <ol {...props} className="my-2 list-decimal space-y-1 pl-6" />
          ),
          li: ({ ...props }) => <li {...props} className="pl-1" />,
          blockquote: ({ ...props }) => (
            <blockquote
              {...props}
              className="my-3 border-l-2 border-slate-600 pl-4 text-slate-400"
            />
          ),
          pre: ({ ...props }) => (
            <pre
              {...props}
              className="my-3 overflow-x-auto rounded-lg border border-slate-700 bg-[#080e19] p-3 text-xs leading-5"
            />
          ),
          code: ({ className, children, ...props }) => (
            <code
              {...props}
              className={`${className || ""} rounded bg-slate-800 px-1 py-0.5 text-indigo-200`}
            >
              {children}
            </code>
          ),
          table: ({ ...props }) => (
            <div className="my-3 max-w-full overflow-x-auto">
              <table
                {...props}
                className="w-full border-collapse text-left text-sm"
              />
            </div>
          ),
          th: ({ ...props }) => (
            <th {...props} className="border border-slate-700 bg-slate-800 p-2" />
          ),
          td: ({ ...props }) => (
            <td {...props} className="border border-slate-700 p-2" />
          ),
          img: ({ ...props }) => (
            <img
              {...props}
              loading="lazy"
              className="my-3 h-auto max-w-full rounded-lg"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}