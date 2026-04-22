"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type LanguageCode = "en" | "hi" | "bn"

type TranslationKey =
  | "layout.language"
  | "layout.logout"
  | "layout.loadingWorkspace"
  | "language.english"
  | "language.hindi"
  | "language.bengali"
  | "gatePass.title"
  | "gatePass.description"
  | "gatePass.total"
  | "gatePass.in"
  | "gatePass.out"
  | "gatePass.noPending"
  | "gatePass.noPdf"
  | "gatePass.view"
  | "gatePass.feedback.in"
  | "gatePass.feedback.out"
  | "gatePass.feedback.failed"
  | "gatePass.columns.gatePassId"
  | "gatePass.columns.orderNo"
  | "gatePass.columns.deliveryNo"
  | "gatePass.columns.vehicle"
  | "gatePass.columns.driver"
  | "gatePass.columns.driverLicense"
  | "gatePass.columns.depo"
  | "gatePass.columns.challanView"
  | "gatePass.columns.requestedBy"
  | "gatePass.columns.approvalStatus"
  | "gatePass.columns.time"
  | "gatePass.detail.totalTitle"
  | "gatePass.detail.totalDescription"
  | "gatePass.detail.totalEmpty"
  | "gatePass.detail.enteredTitle"
  | "gatePass.detail.enteredDescription"
  | "gatePass.detail.enteredEmpty"
  | "gatePass.detail.exitedTitle"
  | "gatePass.detail.exitedDescription"
  | "gatePass.detail.exitedEmpty"
  | "gatePass.detail.back"

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    "layout.language": "Language",
    "layout.logout": "Logout",
    "layout.loadingWorkspace": "Loading your workspace...",
    "language.english": "English",
    "language.hindi": "Hindi",
    "language.bengali": "Bengali",
    "gatePass.title": "Gate Pass Dashboard",
    "gatePass.description": "Manage vehicle gate pass requests and approvals",
    "gatePass.total": "Total Gate Passes",
    "gatePass.in": "In",
    "gatePass.out": "Out",
    "gatePass.noPending": "No pending gate pass requests.",
    "gatePass.noPdf": "No PDF",
    "gatePass.view": "View",
    "gatePass.feedback.in": "Gate pass {id} updated to in.",
    "gatePass.feedback.out": "Gate pass {id} updated to out.",
    "gatePass.feedback.failed": "Failed to update gate pass {id}.",
    "gatePass.columns.gatePassId": "GatePassID",
    "gatePass.columns.orderNo": "Order No",
    "gatePass.columns.deliveryNo": "Delivery No",
    "gatePass.columns.vehicle": "Vehicle",
    "gatePass.columns.driver": "Driver",
    "gatePass.columns.driverLicense": "DriverLicense",
    "gatePass.columns.depo": "Depo",
    "gatePass.columns.challanView": "ChallanView",
    "gatePass.columns.requestedBy": "RequestedBy",
    "gatePass.columns.approvalStatus": "ApprovalStatus",
    "gatePass.columns.time": "Time",
    "gatePass.detail.totalTitle": "Total Gate Passes",
    "gatePass.detail.totalDescription": "All gate pass records from the Gate Pass dashboard card",
    "gatePass.detail.totalEmpty": "No gate passes found.",
    "gatePass.detail.enteredTitle": "Entered Gate Passes",
    "gatePass.detail.enteredDescription": "Gate passes that have completed entry",
    "gatePass.detail.enteredEmpty": "No entered gate passes found.",
    "gatePass.detail.exitedTitle": "Exited Gate Passes",
    "gatePass.detail.exitedDescription": "Gate passes that have completed exit",
    "gatePass.detail.exitedEmpty": "No exited gate passes found.",
    "gatePass.detail.back": "Back",
  },
  hi: {
    "layout.language": "भाषा",
    "layout.logout": "लॉगआउट",
    "layout.loadingWorkspace": "आपका वर्कस्पेस लोड हो रहा है...",
    "language.english": "English",
    "language.hindi": "हिंदी",
    "language.bengali": "বাংলা",
    "gatePass.title": "गेट पास डैशबोर्ड",
    "gatePass.description": "वाहन गेट पास अनुरोध और अनुमोदन प्रबंधित करें",
    "gatePass.total": "कुल गेट पास",
    "gatePass.in": "इन",
    "gatePass.out": "आउट",
    "gatePass.noPending": "कोई लंबित गेट पास अनुरोध नहीं है।",
    "gatePass.noPdf": "पीडीएफ नहीं है",
    "gatePass.view": "देखें",
    "gatePass.feedback.in": "गेट पास {id} को इन किया गया।",
    "gatePass.feedback.out": "गेट पास {id} को आउट किया गया।",
    "gatePass.feedback.failed": "गेट पास {id} अपडेट नहीं हो सका।",
    "gatePass.columns.gatePassId": "गेटपासआईडी",
    "gatePass.columns.orderNo": "ऑर्डर नं.",
    "gatePass.columns.deliveryNo": "डिलीवरी नं.",
    "gatePass.columns.vehicle": "वाहन",
    "gatePass.columns.driver": "ड्राइवर",
    "gatePass.columns.driverLicense": "ड्राइवर लाइसेंस",
    "gatePass.columns.depo": "डिपो",
    "gatePass.columns.challanView": "चालान देखें",
    "gatePass.columns.requestedBy": "अनुरोधकर्ता",
    "gatePass.columns.approvalStatus": "स्थिति",
    "gatePass.columns.time": "समय",
    "gatePass.detail.totalTitle": "कुल गेट पास",
    "gatePass.detail.totalDescription": "गेट पास डैशबोर्ड कार्ड से सभी गेट पास रिकॉर्ड",
    "gatePass.detail.totalEmpty": "कोई गेट पास नहीं मिला।",
    "gatePass.detail.enteredTitle": "एंटर्ड गेट पास",
    "gatePass.detail.enteredDescription": "वे गेट पास जिनका प्रवेश पूरा हो चुका है",
    "gatePass.detail.enteredEmpty": "कोई एंटर्ड गेट पास नहीं मिला।",
    "gatePass.detail.exitedTitle": "एक्सिटेड गेट पास",
    "gatePass.detail.exitedDescription": "वे गेट पास जिनका निकास पूरा हो चुका है",
    "gatePass.detail.exitedEmpty": "कोई एक्सिटेड गेट पास नहीं मिला।",
    "gatePass.detail.back": "वापस",
  },
  bn: {
    "layout.language": "ভাষা",
    "layout.logout": "লগআউট",
    "layout.loadingWorkspace": "আপনার ওয়ার্কস্পেস লোড হচ্ছে...",
    "language.english": "English",
    "language.hindi": "हिंदी",
    "language.bengali": "বাংলা",
    "gatePass.title": "গেট পাস ড্যাশবোর্ড",
    "gatePass.description": "যানবাহনের গেট পাস অনুরোধ এবং অনুমোদন পরিচালনা করুন",
    "gatePass.total": "মোট গেট পাস",
    "gatePass.in": "ইন",
    "gatePass.out": "আউট",
    "gatePass.noPending": "কোনো পেন্ডিং গেট পাস অনুরোধ নেই।",
    "gatePass.noPdf": "পিডিএফ নেই",
    "gatePass.view": "দেখুন",
    "gatePass.feedback.in": "গেট পাস {id} ইন করা হয়েছে।",
    "gatePass.feedback.out": "গেট পাস {id} আউট করা হয়েছে।",
    "gatePass.feedback.failed": "গেট পাস {id} আপডেট করা যায়নি।",
    "gatePass.columns.gatePassId": "গেটপাস আইডি",
    "gatePass.columns.orderNo": "অর্ডার নং",
    "gatePass.columns.deliveryNo": "ডেলিভারি নং",
    "gatePass.columns.vehicle": "যানবাহন",
    "gatePass.columns.driver": "ড্রাইভার",
    "gatePass.columns.driverLicense": "ড্রাইভার লাইসেন্স",
    "gatePass.columns.depo": "ডিপো",
    "gatePass.columns.challanView": "চালান দেখুন",
    "gatePass.columns.requestedBy": "অনুরোধকারী",
    "gatePass.columns.approvalStatus": "স্ট্যাটাস",
    "gatePass.columns.time": "সময়",
    "gatePass.detail.totalTitle": "মোট গেট পাস",
    "gatePass.detail.totalDescription": "গেট পাস ড্যাশবোর্ড কার্ডের সব রেকর্ড",
    "gatePass.detail.totalEmpty": "কোনো গেট পাস পাওয়া যায়নি।",
    "gatePass.detail.enteredTitle": "এন্ট্রি হওয়া গেট পাস",
    "gatePass.detail.enteredDescription": "যে গেট পাসগুলোর এন্ট্রি সম্পন্ন হয়েছে",
    "gatePass.detail.enteredEmpty": "কোনো এন্ট্রি হওয়া গেট পাস পাওয়া যায়নি।",
    "gatePass.detail.exitedTitle": "এক্সিট হওয়া গেট পাস",
    "gatePass.detail.exitedDescription": "যে গেট পাসগুলোর এক্সিট সম্পন্ন হয়েছে",
    "gatePass.detail.exitedEmpty": "কোনো এক্সিট হওয়া গেট পাস পাওয়া যায়নি।",
    "gatePass.detail.back": "ফিরে যান",
  },
}

interface UiLanguageContextValue {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (key: TranslationKey, replacements?: Record<string, string>) => string
}

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null)

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en")

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("dashboard-language") as LanguageCode | null
    if (storedLanguage && translations[storedLanguage]) {
      setLanguage(storedLanguage)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("dashboard-language", language)
  }, [language])

  const value = useMemo<UiLanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, replacements) => {
        let text = translations[language][key] ?? translations.en[key] ?? key
        if (replacements) {
          for (const [name, replacement] of Object.entries(replacements)) {
            text = text.replace(`{${name}}`, replacement)
          }
        }
        return text
      },
    }),
    [language]
  )

  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext)
  if (!context) {
    throw new Error("useUiLanguage must be used within UiLanguageProvider")
  }
  return context
}
