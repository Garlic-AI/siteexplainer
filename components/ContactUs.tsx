import Link from "next/link";
import React, { useState } from "react";

const ContactUs: React.FC = () => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(false)}
        className="text-white font-semibold text-xl hover:underline dark:text-white  md:text-gray-700 md:dark:text-white">
        <Link href="mailto: contact@siteexplainer.com"
          target="_blank" rel="noopener noreferrer">
          Contact Us
        </Link>
        {/* <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfUa3qfg05zRupFY07D2AAEmw3it_Pfs3uc6su4gtkuP2UE4g/viewform">
          Contact Us
        </Link> */}
      </button>
    </>
  );
};
export default ContactUs;
