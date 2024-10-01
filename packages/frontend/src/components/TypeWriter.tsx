import { ReactTyped } from "react-typed";

const typewriter = (sentences : Array<string>) => {
  return (
    
      <h1>
      <ReactTyped
          strings={sentences}
          typeSpeed={150}
          loop
          backSpeed={20}
          cursorChar="|"
          showCursor={true}
        />
      </h1>
        
  );
};

export default typewriter;