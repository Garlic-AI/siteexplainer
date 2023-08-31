import React from 'react';

const FuturePedia = () => {
  return (
    <div className="relative mt-10 m-5">
      <div className="top-0">
        {/* <a
          href="https://www.futurepedia.io/tool/siteexplainer"
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-gray-300 rounded-lg p-4 shadow-md bg-white hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex flex-row items-start">
            <div className="flex-none w-24 h-24 relative mr-4">
              <img
                src={'https://i.ibb.co/QHzTNpq/1669254064026.jpg'}
                alt={'FuturePedia logo'} 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex-grow">
          
              <h3 className="mt-4 text-xl font-semibold mb-2 sm:text-xl text-lg">{"Find us on FuturePedia!"}</h3>
                <p className="hidden sm:block text-sm text-gray-600 sm:text-sm text-xs">
            
                {'If you like our tool, please consider upvoting us on FuturePedia!'}
              </p>
            </div>
          </div>
        </a> */}
      <a href="https://www.futurepedia.io/tool/siteexplainer?utm_source=siteexplainer_embed" style={{ width: '250px', height: '54px' }}
      target="_blank"
      >
      <img
        src="https://www.futurepedia.io/api/image-widget?toolId=7cbff9ae-968f-4f04-b5d9-ad716f75d4e8"
        alt="SiteExplainer | Featured on Futurepedia"
        style={{ width: '250px', height: '54px' }}
      />
    </a>
      </div>
    </div>
  );
};

export default FuturePedia;
