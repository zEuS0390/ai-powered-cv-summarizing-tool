# Importing necessary modules for file operations and password hashing
import docx2txt, PyPDF2, bcrypt

# Function to hash a password using bcrypt
def hash_password(password):
    """
    Hash a password using bcrypt.

    Parameters:
        - password (str): The password to be hashed.

    Returns:
        - bytes: The hashed password.
    """
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

# Function to verify a password using bcrypt
def verify_password(input_password, hashed_password):
    """
    Verify a password against a hashed password using bcrypt.

    Parameters:
        - input_password (str): The input password to be verified.
        - hashed_password (bytes or str): The hashed password for comparison.

    Returns:
        - bool: True if the passwords match, False otherwise.
    """
    # Check if the input password matches the hashed password
    return bcrypt.checkpw(input_password.encode('utf-8'), hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password)

# Function to Extract Text from PDF
def extract_text_from_pdf(pdf_file):
    """
    Extract text content from a PDF file.

    Parameters:
        - pdf_file (str): The path to the PDF file.

    Returns:
        - str or None: The extracted text if successful, or None if an error occurs.
    """
    try:
        with open(pdf_file, "rb") as pdf:
            # Create a PdfReader object
            pdf_reader = PyPDF2.PdfReader(pdf)
            
            # Get the number of pages in the PDF
            num_pages = len(pdf_reader.pages)
            
            # Extract text from each page and concatenate
            pdf_text = "".join([pdf_reader.pages[page].extract_text() for page in range(num_pages)])
        return pdf_text
    except Exception as e:
        # Print an error message if the PDF extraction fails
        print(f"Failed to read PDF: {e}")
        return None

# Function to Extract Text from DOCX
def extract_text_from_docx(docx_file):
    """
    Extract text content from a DOCX file.

    Parameters:
        - docx_file (str): The path to the DOCX file.

    Returns:
        - str or None: The extracted text if successful, or None if an error occurs.
    """
    try:
        # Use docx2txt to extract text from DOCX
        return docx2txt.process(docx_file)
    except Exception as e:
        # Print an error message if the DOCX extraction fails
        print(f"Failed to read DOCX: {e}")
    return None
