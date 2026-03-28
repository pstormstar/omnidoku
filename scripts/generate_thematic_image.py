import argparse
import os
import base64
import time
import google.generativeai as genai
from PIL import Image
import io

def load_api_key():
    """Attempts to load the API key from a .gemini_api_key file in the root."""
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
    except:
        pass
    return None

def generate_thematic_image(image_path, prompt, api_key=None, model_id="gemini-3.1-flash-image-preview", title=None, author=None, rules=None):
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
        metadata_instructions += f"\n- Title the artwork as '{title}'."
    if author:
        metadata_instructions += f"\n- Credite the puzzle to author '{author}'."
    if rules:
        metadata_instructions += f"\n- Integrate these rules beneatht the composition: {rules}"

    try:
        img = Image.open(image_path)
        model = genai.GenerativeModel(model_id)
        
        full_prompt = (
            f"Transform this Sudoku puzzle into a high-fidelity thematic background. "
            f"Theme: {prompt}. "
            f"Requirements: "
            f"1. Preserve the 9x9 grid structure and all numbers perfectly while stylizing them to match. "
            f"2. {metadata_instructions if metadata_instructions else 'Create a cinematic artistic environment.'} "
            f"3. Style: Photorealistic, cinematic, professional layout."
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
    
    args = parser.parse_args()
    
    rules_text = None
    if args.rules_file and os.path.exists(args.rules_file):
        with open(args.rules_file, "r") as f:
            rules_text = f.read()

    generate_thematic_image(
        args.image, 
        args.prompt, 
        args.api_key, 
        args.model, 
        title=args.title, 
        author=args.author, 
        rules=rules_text
    )
