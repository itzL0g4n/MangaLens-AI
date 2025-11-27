export type Language = 'en' | 'vi';

export const translations = {
  en: {
    nav: { read: 'Read', chat: 'Chat', create: 'Create' },
    landing: {
      hero: 'MangaLens AI',
      subtitle: 'Experience manga like never before. Instant AI translation with context awareness and character consistency.',
      features: {
        translate: { title: 'Smart Translate', desc: 'Reads PDF, EPUB, CBZ & Images. Retains formatting & bubbles.' },
        chat: { title: 'Lore Chat', desc: 'Deep dive into plots and characters with an expert AI companion.' }
      },
      cta: 'Launch App',
      footer: 'Powered by Gemini 2.5 Flash & 3 Pro'
    },
    translator: {
        upload: {
            title: 'Upload Manga Pages',
            subtitle: 'PDF, EPUB, CBZ, AZW3/MOBI, Images',
            max: 'Max {max} pages',
            processing: 'Processing Files...',
            loading: 'Loading first 20 pages...',
            add: 'Add'
        },
        controls: {
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out',
            reset: 'Reset View',
            prev: 'Previous Page',
            next: 'Next Page',
            retranslate: 'Retranslate',
            retry: 'Retry',
            translate: 'Translate Page',
            reading: 'Reading...',
            remove: 'Remove Page'
        },
        context: {
            button: 'Series Context',
            active: 'Active',
            none: 'None',
            empty: 'Identify this manga series or add manual lore to improve translation accuracy.',
            detectBtn: 'Auto-Detect Series',
            detecting: 'Detecting...',
            or: 'OR',
            manualBtn: 'Enter Manually',
            titleLabel: 'Series Title',
            titlePlaceholder: 'e.g. One Piece',
            infoLabel: 'Context / Lore / Terminology',
            infoPlaceholder: 'Add character names, relationships, or specific terms...',
            sourcesLabel: 'Sources',
            clear: 'Clear Context'
        },
        header: {
            bubbles: 'bubbles',
            langLabel: 'Output Language',
            translateAll: 'Translate Remaining ({count})',
            stop: 'Stop Translation',
            summaryTitle: 'Page Summary'
        },
        emptyState: {
            deciphering: 'Deciphering glyphs...',
            waiting: 'Click "Translate" to reveal the story'
        }
    },
    chat: {
        header: 'AI Assistant',
        subheader: 'Powered by Gemini 3 Pro',
        inputPlaceholder: 'Ask about your favorite manga...',
        initialMessage: "Hello! I'm your MangaLens AI assistant. Ask me about manga recommendations, translations, or plot explanations!"
    },
    imageGen: {
        header: 'Manga Artist Studio',
        subheader: 'Generate professional quality manga artwork (Nano Banana Pro)',
        promptLabel: 'Prompt',
        promptPlaceholder: 'Describe the manga scene, character, or panel you want to create...',
        resolutionLabel: 'Resolution',
        generateBtn: 'Generate Artwork',
        dreaming: 'Dreaming...',
        access: {
            title: 'Access Required',
            desc: 'To use the high-quality Gemini 3 Pro Image Preview model, you must select a paid API key.',
            btn: 'Select API Key',
            docs: 'Learn more about billing at'
        },
        empty: {
            title: 'Your masterpiece awaits',
            desc: 'Enter a prompt to start'
        }
    }
  },
  vi: {
    nav: { read: 'Đọc', chat: 'Trò chuyện', create: 'Tạo ảnh' },
    landing: {
      hero: 'MangaLens AI',
      subtitle: 'Trải nghiệm manga chưa từng có. Dịch thuật AI tức thì với khả năng hiểu ngữ cảnh và nhân vật.',
      features: {
        translate: { title: 'Dịch Thông Minh', desc: 'Hỗ trợ PDF, EPUB, CBZ & Ảnh. Giữ nguyên định dạng & bong bóng thoại.' },
        chat: { title: 'Trò Chuyện Cốt Truyện', desc: 'Khám phá sâu cốt truyện và nhân vật với trợ lý AI chuyên gia.' }
      },
      cta: 'Bắt đầu ngay',
      footer: 'Sử dụng công nghệ Gemini 2.5 Flash & 3 Pro'
    },
    translator: {
        upload: {
            title: 'Tải lên trang Manga',
            subtitle: 'PDF, EPUB, CBZ, AZW3/MOBI, Ảnh',
            max: 'Tối đa {max} trang',
            processing: 'Đang xử lý tệp...',
            loading: 'Đang tải 20 trang đầu...',
            add: 'Thêm'
        },
        controls: {
            zoomIn: 'Phóng to',
            zoomOut: 'Thu nhỏ',
            reset: 'Đặt lại',
            prev: 'Trang trước',
            next: 'Trang sau',
            retranslate: 'Dịch lại',
            retry: 'Thử lại',
            translate: 'Dịch trang',
            reading: 'Đang đọc...',
            remove: 'Xóa trang'
        },
        context: {
            button: 'Ngữ cảnh bộ truyện',
            active: 'Đã bật',
            none: 'Trống',
            empty: 'Nhận diện bộ manga hoặc thêm thông tin thủ công để cải thiện độ chính xác.',
            detectBtn: 'Tự động nhận diện',
            detecting: 'Đang tìm...',
            or: 'HOẶC',
            manualBtn: 'Nhập thủ công',
            titleLabel: 'Tên bộ truyện',
            titlePlaceholder: 'VD: One Piece',
            infoLabel: 'Ngữ cảnh / Thuật ngữ',
            infoPlaceholder: 'Thêm tên nhân vật, mối quan hệ, hoặc thuật ngữ riêng...',
            sourcesLabel: 'Nguồn tham khảo',
            clear: 'Xóa ngữ cảnh'
        },
        header: {
            bubbles: 'thoại',
            langLabel: 'Ngôn ngữ đích',
            translateAll: 'Dịch còn lại ({count})',
            stop: 'Dừng dịch',
            summaryTitle: 'Tóm tắt trang'
        },
        emptyState: {
            deciphering: 'Đang giải mã...',
            waiting: 'Nhấn "Dịch trang" để xem nội dung'
        }
    },
    chat: {
        header: 'Trợ lý AI',
        subheader: 'Sử dụng Gemini 3 Pro',
        inputPlaceholder: 'Hỏi về bộ manga yêu thích của bạn...',
        initialMessage: "Xin chào! Tôi là trợ lý MangaLens AI. Hãy hỏi tôi về gợi ý manga, dịch thuật hoặc giải thích cốt truyện nhé!"
    },
    imageGen: {
        header: 'Xưởng Vẽ Manga',
        subheader: 'Tạo tác phẩm manga chất lượng cao (Nano Banana Pro)',
        promptLabel: 'Mô tả',
        promptPlaceholder: 'Mô tả cảnh, nhân vật hoặc khung tranh bạn muốn tạo...',
        resolutionLabel: 'Độ phân giải',
        generateBtn: 'Tạo tác phẩm',
        dreaming: 'Đang vẽ...',
        access: {
            title: 'Yêu cầu quyền truy cập',
            desc: 'Để sử dụng mô hình Gemini 3 Pro Image Preview chất lượng cao, bạn cần chọn khóa API trả phí.',
            btn: 'Chọn khóa API',
            docs: 'Tìm hiểu thêm về thanh toán tại'
        },
        empty: {
            title: 'Kiệt tác đang chờ bạn',
            desc: 'Nhập mô tả để bắt đầu'
        }
    }
  }
};