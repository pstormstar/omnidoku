import argparse
import os
import base64
import time
import google.generativeai as genai
from PIL import Image
import io

def load_api_key():
    """Attempts to load the API key from the environment, then a local file."""
    # 1. First, check the Vercel environment variables
    env_key = os.getenv("GEMINI_API_KEY")
    if env_key:
        return env_key

    # 2. Fallback to local files (for local testing)
    try:
        paths = [".gemini_api_key", "../.gemini_api_key", "omnidoku/.gemini_api_key"]
        for path in paths:
            if os.path.exists(path):
                with open(path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        return line
    except Exception as e:
        print(f"Warning: Could not read local key file: {e}")
        pass
    
    return None

def generate_thematic_image(image_path, prompt, api_key=None, model_id="gemini-3.1-flash-image-preview", title=None, author=None, rules=None, structure=None):
    """
    Generates a thematic background/image using Gemini 3.1 Flash Image Preview (Image-to-Image).
    Integrates title, author, and rules into the final asset structure.
    """
    if not api_key:
        api_key = load_api_key()
        
    if not api_key:
        print("Error: No API key provided and .gemini_api_key file not found or empty.")
        return False

    genai.configure(api_key=api_key)
    
    # Construct metadata block for the prompt
    metadata_instructions = ""
    if title:
        metadata_instructions += f"\n- Clearly render the puzzle title '{title}' at the top of the piece, well away from the grid."
    if author:
        metadata_instructions += f"\n- Display the author attribution 'By {author}' near the title."
    if rules:
        metadata_instructions += f"\n- Legibly integrate the following rules into a dedicated sidebar or bottom panel: {rules}"

    has_meta = bool(metadata_instructions)

    if not metadata_instructions:
        metadata_instructions = "\n- Pure Artboard: Do not add any additional text, labels, titles, or rules to the image. Focus purely on the thematic background art."

    critical_rule = (
        " 4. CRITICAL: Under no condition should the puzzle title, author name, or rules text be placed inside the 9x9 Sudoku grid. All descriptive text and metadata MUST be kept on the margins, side-panels, or periphery of the image."
        if has_meta else ""
    )

    try:
        img = Image.open(image_path)
        model = genai.GenerativeModel(model_id)

        structure_line = f"Puzzle Structure: {structure} " if structure else ""
        
        full_prompt = (
            f"Transform this Sudoku puzzle into a professional, thematic layout. "
            f"{structure_line}"
            f"Thematic Prompt: {prompt}. "
            f"Requirements: "
            f"1. Maintain the 9x9 grid structure of each grid and all pre-filled numbers with 100% accuracy. "
            f"2. Layout Integration: {metadata_instructions} "
            f"3. Style: High-fidelity digital art, cinematic lighting, legible typography for rules and title."
            f"{critical_rule}"
        )

        response = model.generate_content([full_prompt, img])
        
        print("\n--- GEMINI IMAGE RESPONSE ---")
        
        found_image = False
        if hasattr(response, 'candidates') and len(response.candidates) > 0:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data.mime_type.startswith('image/'):
                    img_data = part.inline_data.data
                    output_path = f"tmp/generated_art_{int(time.time())}.png"
                    os.makedirs("tmp", exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(img_data)
                    print(f"IMAGE_GENERATED: {output_path}")
                    found_image = True
                    break
        
        if not found_image:
            print("Notice: No direct image binary found in response. Displaying text blueprint instead.")
            print(response.text)
        
        return True
        
    except Exception as e:
        print(f"Error during {model_id} generation: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate thematic art using Gemini Image-to-Image.")
    parser.add_argument("--image", required=True)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--api_key", default=None)
    parser.add_argument("--model", default="gemini-3.1-flash-image-preview")
    parser.add_argument("--title", default=None)
    parser.add_argument("--author", default=None)
    parser.add_argument("--rules_file", default=None)
    parser.add_argument("--structure_file", default=None)
    
    args = parser.parse_args()
    
    rules_text = None
    if args.rules_file and os.path.exists(args.rules_file):
        with open(args.rules_file, "r") as f:
            rules_text = f.read()

    structure_text = None
    if args.structure_file and os.path.exists(args.structure_file):
        with open(args.structure_file, "r") as f:
            structure_text = f.read()

    generate_thematic_image(
        args.image, 
        args.prompt, 
        args.api_key, 
        args.model, 
        title=args.title, 
        author=args.author, 
        rules=rules_text,
        structure=structure_text
    )
