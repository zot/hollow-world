import { Crepe, CrepeFeature } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

export interface IMilkdownEditor {
    crepe: Crepe;
    destroy(): void;
    getMarkdown(): string;
    setMarkdown(markdown: string): void;
}

export class MilkdownUtils {
    static async createEditor(
        container: HTMLElement,
        initialValue: string = '',
        onChange?: (markdown: string) => void
    ): Promise<IMilkdownEditor> {
        // Ensure initialValue is a valid string (not undefined, null, or non-string)
        const safeInitialValue = (typeof initialValue === 'string' ? initialValue : '').trim();

        const crepe = new Crepe({
            root: container,
            defaultValue: safeInitialValue,
            features: {
                [CrepeFeature.ListItem]: true,
                [CrepeFeature.BlockEdit]: true,
                [CrepeFeature.Placeholder]: true,
                [CrepeFeature.Cursor]: true,
                [CrepeFeature.Toolbar]: true,
                [CrepeFeature.LinkTooltip]: true,
                [CrepeFeature.ImageBlock]: true,
                [CrepeFeature.Table]: true,
                [CrepeFeature.CodeMirror]: true,
            }
        });

        try {
            await crepe.create();
        } catch (error) {
            console.error('Failed to create Crepe editor with initial value:', error);
            // If creation fails, try again with empty value
            const fallbackCrepe = new Crepe({
                root: container,
                defaultValue: '',
                features: {
                    [CrepeFeature.ListItem]: true,
                    [CrepeFeature.BlockEdit]: true,
                    [CrepeFeature.Placeholder]: true,
                    [CrepeFeature.Cursor]: true,
                    [CrepeFeature.Toolbar]: true,
                    [CrepeFeature.LinkTooltip]: true,
                    [CrepeFeature.ImageBlock]: true,
                    [CrepeFeature.Table]: true,
                    [CrepeFeature.CodeMirror]: true,
                }
            });
            await fallbackCrepe.create();

            // Use fallback crepe for the rest of the function
            return this.setupCrepeInstance(fallbackCrepe, onChange);
        }

        return this.setupCrepeInstance(crepe, onChange);
    }

    private static setupCrepeInstance(crepe: Crepe, onChange?: (markdown: string) => void): IMilkdownEditor {
        // Set up onChange listener if provided using Crepe's event system
        if (onChange) {
            crepe.on((listener) => {
                listener.markdownUpdated((markdown) => {
                    onChange(markdown);
                });
            });
        }

        return {
            crepe,
            destroy() {
                crepe.destroy();
            },
            getMarkdown(): string {
                return crepe.getMarkdown();
            },
            setMarkdown(markdown: string): void {
                crepe.setMarkdown(markdown);
            }
        };
    }

    static importCrepeStyles(): void {
        // Crepe styles are imported via the imports at the top of this file
        // This method is kept for compatibility but is no longer needed
    }
}
