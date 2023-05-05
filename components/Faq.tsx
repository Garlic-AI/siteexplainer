import React, { useState } from "react";

const Faq = () => {
  const [selected, setSelected] = useState(null);

  const toggle = (i: any) => {
    if (selected === i) {
      return setSelected(null);
    }
    setSelected(i);
  };

  return (
    <div className="md:max-w-3xl w-full  flex flex-col lg:flex-row ">
      <div className="flex flex-col mx-4">
        <div className="flex flex-col justify-center items-center">
          <div className=" my-10">
            <h1 className="text-4xl text-black font-semibold text-center mb-8 border-b-4 w-24 mx-auto border-black dark:text-white dark:border-white">
              FAQ
            </h1>
            {data.map((item, i) => (
              <div
                key={i}
                className="bg-[#c5c2c2] shadow-inner shadow-gray-600 mb-3 py-3 px-8 rounded-md">
                <div
                  className="text-gray-700 font-semibold text-md flex justify-between items-center cursor-pointer "
                  onClick={() => toggle(i)}>
                  <h1>{item.question}</h1>
                  <span>{selected === i ? "-" : "+"}</span>
                </div>
                <div className={selected === i ? "content show " : "content"}>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const data = [
  {
    question: "What is SiteExplainer?",
    answer:
      "SiteExplainer is a website dedicated to simplifying and summarizing complicated landing pages and corporate jargon used on websites. It uses AI-powered technology to quickly and easily explain a website's content and presents it in a readable and straightforward format.",
  },
  {
    question: "How does SiteExplainer work?",
    answer:
      "SiteExplainer uses advanced artificial intelligence and machine learning technology to analyze the content of a website and present a summary of the main ideas and key points. It simplifies the language used on landing pages and eliminates corporate jargon to help visitors better understand a website's content.",
  },
  {
    question: "Why should I use SiteExplainer?",
    answer:
      "SiteExplainer is designed to help visitors understand complex content and technical language used on websites. It saves time and makes it easier to navigate through confusing landing pages. Using SiteExplainer can help visitors quickly identify the most relevant information on a website.",
  },
  {
    question: "Is SiteExplainer free to use?",
    answer:
      "Yes, SiteExplainer is completely free to use. However, the website is open to sponsorship, and donations are welcome to support the project.",
  },
  {
    question: "What types of websites can SiteExplainer simplify?",
    answer:
      "SiteExplainer can simplify any website, including those with complex language, corporate jargon, and confusing landing pages. The tool is particularly useful for visitors who are unfamiliar with technical language or who want to quickly understand a website's content.",
  },
  {
    question: "Is SiteExplainer's summary accurate?",
    answer:
      "SiteExplainer's summary is generated using advanced AI-powered technology and machine learning algorithms that analyze the content on the website. While the summary may not be 100% accurate, it provides an overview of the main ideas and key points of the website.",
  },
  {
    question: "Can I use SiteExplainer on mobile devices?",
    answer:
      "Yes, SiteExplainer is compatible with both desktop and mobile devices. The website's responsive design ensures that the tool works seamlessly on any device.",
  },
  {
    question: "How can I contact the maker of SiteExplainer?",
    answer:
      "If you have any feedback, suggestions, or questions, please reach out to me (Michael, the maker of SiteExplainer) on Twitter or by email.",
  },
  {
    question: "Can my product be featured on this site?",
    answer:
      "Yes! Just send an email to contact@siteexplainer.com to discuss sponsorships and partnerships. This site is VERY expensive to run so I appreciate the help!",
  }
];

export default Faq;
